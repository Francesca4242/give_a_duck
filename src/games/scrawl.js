/* Scrawl-ack (online): everyone plays at once. N chains travel round the flock:
   write → draw → guess → draw … then the host walks everyone through the reveal. */
const MAX_IMG = 400_000;

export default {
  min: 3,
  start(R, roster, opts) {
    const n = roster.length;
    const steps = Math.max(2, Math.min(n, +opts.steps || n));
    const seconds = [0, 45, 60, 90, 120].includes(+opts.seconds) ? +opts.seconds : 75;
    const g = { phase: "play", step: 0, steps, seconds, chains: roster.map(() => []), subs: {}, deadline: null, r: { c: 0, i: 0, done: false } };
    return g;
  },
  tick(R, g) { if (g.phase === "play" && g.deadline && R.now() > g.deadline + 5000) advance(R, g); },
  act(R, g, pid, m, isHost) {
    switch (m.a) {
      case "submit": {
        if (g.phase !== "play" || !g.roster.includes(pid) || g.subs[pid]) return;
        const type = g.step % 2 === 0 ? "text" : "draw";
        let content = m.content;
        if (type === "text") {
          content = String(content || "").trim().slice(0, 90);
          if (!content) return "Write something first!";
        } else if (typeof content !== "string" || !content.startsWith("data:image/") || content.length > MAX_IMG) return "That drawing didn't make it. Try again?";
        const c = chainOf(g, pid);
        g.chains[c][g.step] = { by: pid, type, content };
        g.subs[pid] = true;
        if (g.roster.filter(R.connected).every((p) => g.subs[p])) advance(R, g);
        return;
      }
      case "force":
        if (g.phase === "play" && isHost) advance(R, g);
        return;
      case "rnext": {
        if (g.phase !== "reveal" || !isHost) return;
        const r = g.r;
        if (r.i < g.chains[r.c].length - 1) r.i++;
        else if (r.c < g.chains.length - 1) { r.c++; r.i = 0; }
        else r.done = true;
        return;
      }
      case "rprev": {
        if (g.phase !== "reveal" || !isHost) return;
        const r = g.r;
        r.done = false;
        if (r.i > 0) r.i--; else if (r.c > 0) { r.c--; r.i = g.chains[r.c].length - 1; }
        return;
      }
    }
  },
  view(R, g, pid) {
    const v = { phase: g.phase, step: g.step, steps: g.steps, seconds: g.seconds, deadline: g.deadline, done: Object.keys(g.subs) };
    if (g.phase === "play" && g.roster.includes(pid)) {
      v.type = g.step % 2 === 0 ? "text" : "draw";
      v.submitted = !!g.subs[pid];
      if (g.step > 0) v.prev = g.chains[chainOf(g, pid)][g.step - 1];
    }
    if (g.phase === "reveal") {
      const ch = g.chains[g.r.c];
      v.reveal = { c: g.r.c, chains: g.chains.length, i: g.r.i, len: ch.length, done: g.r.done, starter: ch[0] && ch[0].by, items: ch.slice(0, g.r.i + 1) };
    }
    return v;
  },
};

// At step k, player number p works on chain (p - k) mod n — so they always get the previous player's work.
function chainOf(g, pid) {
  const n = g.roster.length, p = g.roster.indexOf(pid);
  return (((p - g.step) % n) + n) % n;
}

function advance(R, g) {
  // fill gaps left by ducks who wandered off
  g.roster.forEach((pid) => {
    if (g.subs[pid]) return;
    const c = chainOf(g, pid), type = g.step % 2 === 0 ? "text" : "draw";
    g.chains[c][g.step] = { by: pid, type, content: type === "text" ? (g.step === 0 ? R.fresh("scrawl", R.C.pool(R.C.scrawl, R.cheeky), 1)[0] : "🤷 (this duck wandered off)") : null };
  });
  g.subs = {};
  g.step++;
  if (g.step >= g.steps) { g.phase = "reveal"; g.deadline = null; R.clearLater(); return; }
  const drawing = g.step % 2 === 1;
  if (drawing && g.seconds) {
    g.deadline = R.now() + g.seconds * 1000;
    R.later(g.seconds * 1000 + 5000, () => { if (g.phase === "play") advance(R, g); }); // grace for auto-submits
  } else { g.deadline = null; R.clearLater(); }
}
