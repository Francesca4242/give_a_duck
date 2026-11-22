/* Doodle Duck (online): one duck draws live on their phone, everyone else races to type the answer.
   Ink is streamed to the other phones as it's drawn. */
const CHOOSE_SECS = 15, REVEAL_SECS = 8, MAX_POINTS = 25000;

const norm = (s) => String(s || "").toLowerCase().replace(/\s*\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const target = (w) => w.replace(/\s*\(.*?\)/g, "");

function startTurn(R, g) {
  if (g.turn >= g.order.length * g.laps) { g.phase = "final"; R.clearLater(); return; }
  g.drawer = g.order[g.turn % g.order.length];
  g.choices = R.fresh("doodle", R.C.pool(R.C.doodle, R.cheeky), 3);
  g.word = null; g.strokes = []; g.guessed = {}; g.feed = []; g.points = 0;
  g.phase = "choose";
  g.deadline = R.now() + CHOOSE_SECS * 1000;
  if (!R.connected(g.drawer)) { g.turn++; return startTurn(R, g); }
  R.later(CHOOSE_SECS * 1000 + 1000, () => choose(R, g, g.choices[0]));
}

function choose(R, g, word) {
  if (g.phase !== "choose") return;
  g.word = word;
  const letters = [...target(word)].map((c, i) => (/[a-z0-9]/i.test(c) ? i : -1)).filter((i) => i >= 0);
  g.hints = R.shuffle(letters).slice(0, Math.min(2, Math.max(0, letters.length - 2)));
  g.phase = "draw";
  g.started = R.now();
  g.deadline = g.started + g.seconds * 1000;
  R.later(g.seconds * 1000, () => endTurn(R, g));
}

function endTurn(R, g) {
  if (g.phase !== "draw") return;
  g.phase = "reveal";
  g.deadline = R.now() + REVEAL_SECS * 1000;
  const n = Object.keys(g.guessed).length;
  if (n) { g.scores[g.drawer] = (g.scores[g.drawer] || 0) + n * 50; R.award(g.drawer, 1); }
  R.later(REVEAL_SECS * 1000, () => { g.turn++; startTurn(R, g); });
}

const guessers = (R, g) => g.roster.filter((p) => p !== g.drawer && R.connected(p));

export default {
  min: 3,
  start(R, roster, opts) {
    const g = { roster, order: R.shuffle(roster), laps: [1, 2].includes(+opts.laps) ? +opts.laps : 1, seconds: [60, 80, 100].includes(+opts.seconds) ? +opts.seconds : 80, turn: 0, scores: {} };
    startTurn(R, g);
    return g;
  },
  tick(R, g) {
    if (!g.deadline || R.now() < g.deadline + 2000) return;
    if (g.phase === "choose") choose(R, g, g.choices[0]);
    else if (g.phase === "draw") endTurn(R, g);
    else if (g.phase === "reveal") { g.turn++; startTurn(R, g); }
  },
  act(R, g, pid, m, isHost) {
    switch (m.a) {
      case "choose":
        if (g.phase === "choose" && pid === g.drawer && g.choices.includes(m.word)) { R.clearLater(); choose(R, g, m.word); }
        return;
      case "ink": {
        if (g.phase !== "draw" || pid !== g.drawer) return "quiet";
        const pts = (a) => Array.isArray(a) ? a.slice(0, 400).filter((p) => Array.isArray(p) && p.length === 2).map(([x, y]) => [Math.round(+x) || 0, Math.round(+y) || 0]) : [];
        const total = g.strokes.reduce((n, s) => n + s.p.length, 0);
        let out;
        if (m.op === "start" && total < MAX_POINTS) {
          const s = { c: /^#[0-9a-fA-F]{6}$/.test(m.c) ? m.c : "#3b2618", w: Math.max(1, Math.min(40, +m.w || 8)), p: pts(m.p) };
          g.strokes.push(s); out = { t: "ink", op: "start", s };
        } else if (m.op === "more" && g.strokes.length && total < MAX_POINTS) {
          const p = pts(m.p); g.strokes[g.strokes.length - 1].p.push(...p); out = { t: "ink", op: "more", p };
        } else if (m.op === "undo") { g.strokes.pop(); out = { t: "ink", op: "undo" }; }
        else if (m.op === "clear") { g.strokes = []; out = { t: "ink", op: "clear" }; }
        if (out) R.sendAll(out, pid);
        return "quiet";
      }
      case "guess": {
        if (g.phase !== "draw" || pid === g.drawer || !g.roster.includes(pid) || g.guessed[pid] !== undefined) return;
        const text = String(m.text || "").trim().slice(0, 40);
        if (!text) return;
        const a = norm(text), w = norm(g.word);
        if (a === w) {
          const left = Math.max(0, g.deadline - R.now()) / (g.seconds * 1000);
          const pts = 100 + Math.round(200 * left) + (Object.keys(g.guessed).length === 0 ? 50 : 0);
          g.guessed[pid] = pts;
          g.scores[pid] = (g.scores[pid] || 0) + pts;
          R.award(pid, 1);
          g.feed.push({ pid, kind: "correct" });
          if (guessers(R, g).every((p) => g.guessed[p] !== undefined)) { R.clearLater(); endTurn(R, g); }
        } else {
          g.feed.push({ pid, text, kind: w.length > 3 && lev(a, w) <= 1 ? "close" : "guess" });
        }
        if (g.feed.length > 14) g.feed.splice(0, g.feed.length - 14);
        return;
      }
      case "next":
        if (g.phase === "reveal" && (isHost || pid === g.drawer)) { R.clearLater(); g.turn++; startTurn(R, g); }
        return;
      case "skip":
        if (isHost && (g.phase === "choose" || g.phase === "draw")) { R.clearLater(); g.phase = "draw"; endTurn(R, g); }
        return;
    }
  },
  view(R, g, pid) {
    const drawing = pid === g.drawer;
    const v = { phase: g.phase, drawer: g.drawer, turn: g.turn, total: g.order.length * g.laps, deadline: g.deadline, seconds: g.seconds, scores: g.scores };
    if (g.phase === "choose" && drawing) v.choices = g.choices;
    if (g.phase === "draw" || g.phase === "reveal") {
      v.strokes = g.strokes;
      v.guessed = g.guessed;
      v.feed = g.feed.filter((f) => f.kind !== "close" || f.pid === pid);
      const knows = drawing || g.guessed[pid] !== undefined || g.phase === "reveal";
      if (knows) v.word = g.word;
      const t = target(g.word), frac = (R.now() - g.started) / (g.seconds * 1000);
      const shown = new Set(g.hints.slice(0, frac > 0.75 ? 2 : frac > 0.5 ? 1 : 0));
      v.hint = [...t].map((c, i) => (/[a-z0-9]/i.test(c) ? (shown.has(i) ? c : "_") : c)).join("");
    }
    return v;
  },
};
