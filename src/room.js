/* One Durable Object per room code. Holds the room in memory while anyone is
   connected, runs the game logic, and sends every player their own view. */
import "../public/js/content.js";
import { GAMES } from "./games/index.js";

const C = globalThis.GAD_CONTENT;
const rid = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const MAX_PLAYERS = 24;

export class Room {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.socks = new Map(); // WebSocket -> pid (or null before join)
    this.timer = null;
    this.s = { code: null, claimed: false, host: null, players: [], cheeky: true, game: null };
    // Restore after eviction (e.g. every phone went to sleep).
    ctx.blockConcurrencyWhile(async () => {
      const meta = await ctx.storage.get("room");
      if (meta) Object.assign(this.s, meta);
      const game = await ctx.storage.get("game");
      if (game && this.s.claimed) this.s.game = game;
    });
  }

  persist() {
    const { game, ...meta } = this.s;
    this.ctx.storage.put("room", meta).catch(() => {});
    if (!game) this.ctx.storage.delete("game").catch(() => {});
    else this.ctx.storage.put("game", game).catch(() => { /* too big (lots of drawings): memory only */ });
  }

  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/claim") {
      if (this.s.claimed) return Response.json({ ok: false });
      this.s.claimed = true;
      this.s.code = url.searchParams.get("code");
      this.persist();
      return Response.json({ ok: true });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    this.socks.set(server, null);
    server.addEventListener("message", (e) => {
      let m;
      try { m = JSON.parse(e.data); } catch { return; }
      try { this.onMessage(server, m); } catch (err) { this.send(server, { t: "error", msg: "Something went quackers: " + err.message }); }
    });
    const gone = () => this.onClose(server);
    server.addEventListener("close", gone);
    server.addEventListener("error", gone);
    return new Response(null, { status: 101, webSocket: client });
  }

  send(ws, msg) { try { ws.send(JSON.stringify(msg)); } catch { /* closed */ } }

  player(pid) { return this.s.players.find((p) => p.pid === pid); }
  connected(pid) { for (const v of this.socks.values()) if (v === pid) return true; return false; }
  /** The host is the room creator; if they're gone, the first connected player stands in. */
  effectiveHost() {
    if (this.s.host && this.connected(this.s.host)) return this.s.host;
    const p = this.s.players.find((x) => this.connected(x.pid));
    return p ? p.pid : this.s.host;
  }

  onMessage(ws, m) {
    if (m.t === "join") return this.join(ws, m);
    const pid = this.socks.get(ws);
    if (!pid) return this.send(ws, { t: "error", msg: "Join first" });
    if (m.t === "ping") return this.send(ws, { t: "pong" });
    if (m.t !== "act") return;
    // Catch up on any deadline that passed while no timer was running (e.g. after a restore).
    if (this.s.game && GAMES[this.s.game.id].tick) GAMES[this.s.game.id].tick(this.api(), this.s.game);
    const isHost = pid === this.effectiveHost();
    const me = this.player(pid);
    switch (m.a) {
      case "look":
        if (m.look && typeof m.look === "object") me.look = sanitizeLook(m.look);
        break;
      case "cheeky":
        if (isHost) this.s.cheeky = !!m.v;
        break;
      case "kick":
        if (isHost && m.pid !== pid) {
          this.s.players = this.s.players.filter((p) => p.pid !== m.pid);
          for (const [w, v] of this.socks) if (v === m.pid) { this.send(w, { t: "kicked" }); this.socks.set(w, null); try { w.close(4000, "kicked"); } catch {} }
        }
        break;
      case "start":
        if (!isHost || !GAMES[m.game]) break;
        this.startGame(m.game, m.opts || {});
        break;
      case "again":
        if (isHost && this.s.game) this.startGame(this.s.game.id, this.s.game.opts);
        break;
      case "lobby":
        if (isHost) { this.clearLater(); this.s.game = null; }
        break;
      case "resetScores":
        if (isHost) this.s.players.forEach((p) => (p.score = 0));
        break;
      default:
        if (this.s.game) {
          const err = GAMES[this.s.game.id].act(this.api(), this.s.game, pid, m, isHost);
          if (err) return this.send(ws, { t: "error", msg: err });
        }
    }
    this.broadcast();
  }

  startGame(id, opts) {
    const G = GAMES[id];
    const roster = this.s.players.filter((p) => this.connected(p.pid)).map((p) => p.pid);
    if (roster.length < G.min) return;
    this.clearLater();
    this.s.game = Object.assign({ id, opts, roster, gid: Date.now() }, G.start(this.api(), roster, opts));
  }

  join(ws, m) {
    const name = String(m.name || "").trim().replace(/\s+/g, " ").slice(0, 18);
    if (!this.s.claimed) return this.send(ws, { t: "error", fatal: true, msg: "No room with that code. Check it and try again." });
    // reconnect with saved credentials
    let p = m.pid && this.player(m.pid);
    if (p && p.key !== m.key) p = null;
    if (!p && name) {
      const same = this.s.players.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (same) {
        if (this.connected(same.pid)) return this.send(ws, { t: "error", msg: `There's already a ${same.name} here. Pick another name!` });
        p = same; // they lost their phone's memory; let them back in as themselves
      }
    }
    if (!p) {
      if (!name) return this.send(ws, { t: "error", msg: "Every duck needs a name." });
      if (this.s.players.length >= MAX_PLAYERS) return this.send(ws, { t: "error", fatal: true, msg: "This pond is full (24 ducks max)." });
      p = { pid: rid(), key: rid(), name, look: sanitizeLook(m.look), score: 0 };
      this.s.players.push(p);
      if (!this.s.host) this.s.host = p.pid;
    } else if (m.look) p.look = sanitizeLook(m.look);
    // one socket per player: drop any older socket
    for (const [w, v] of this.socks) if (v === p.pid && w !== ws) { this.socks.set(w, null); try { w.close(4001, "replaced"); } catch {} }
    this.socks.set(ws, p.pid);
    this.send(ws, { t: "welcome", pid: p.pid, key: p.key, code: this.s.code });
    this.broadcast();
  }

  onClose(ws) {
    if (!this.socks.has(ws)) return;
    this.socks.delete(ws);
    this.broadcast();
  }

  /* ---------- timers ---------- */
  later(ms, fn) {
    this.clearLater();
    const t = setTimeout(() => { if (this.timer !== t) return; this.timer = null; try { fn(); } finally { this.broadcast(); } }, ms);
    this.timer = t;
  }
  clearLater() { if (this.timer) clearTimeout(this.timer); this.timer = null; }

  /** Helpers handed to game modules. */
  api() {
    const self = this;
    return {
      C, shuffle, pick,
      get cheeky() { return self.s.cheeky; },
      connected: (pid) => self.connected(pid),
      name: (pid) => (self.player(pid) || { name: "A mystery duck" }).name,
      award: (pid, n) => { const p = self.player(pid); if (p) p.score += n; },
      later: (ms, fn) => self.later(ms, fn),
      clearLater: () => self.clearLater(),
      now: () => Date.now(),
    };
  }

  view(pid) {
    const host = this.effectiveHost();
    const g = this.s.game;
    return {
      code: this.s.code,
      me: pid,
      host,
      cheeky: this.s.cheeky,
      now: Date.now(),
      players: this.s.players.map((p) => ({ pid: p.pid, name: p.name, look: p.look, score: p.score, on: this.connected(p.pid) })),
      game: g ? Object.assign({ id: g.id, opts: g.opts, roster: g.roster, gid: g.gid }, GAMES[g.id].view(this.api(), g, pid, pid === host)) : null,
    };
  }

  broadcast() {
    this.persist();
    for (const [ws, pid] of this.socks) if (pid) this.send(ws, { t: "state", s: this.view(pid) });
  }
}

const COLOR = /^#[0-9a-fA-F]{6}$/;
const HATS = new Set(["none", "party", "top", "crown", "shades", "bow", "beanie", "flower", "cap", "halo", "horns"]);
const MOODS = new Set(["normal", "happy", "sly", "wink"]);
function sanitizeLook(l) {
  l = l || {};
  return {
    body: COLOR.test(l.body) ? l.body : "#FFD23F",
    head: COLOR.test(l.head) ? l.head : null,
    hat: HATS.has(l.hat) ? l.hat : "none",
    mood: MOODS.has(l.mood) ? l.mood : "normal",
  };
}
