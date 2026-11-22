/* Quackers (online): 20 shared cards per game; everyone votes on their own phone,
   results are revealed, and the game ends with an awards ceremony. Play again = a fresh 20. */
const TYPES = ["likely", "whowould", "never", "rather", "hottake", "fowl"];
const DECK_SIZE = 20;
const VALID = { never: ["yes", "no"], rather: ["a", "b"], hottake: ["agree", "disagree"] };

function build(R, mode) {
  const src = R.C.quackers, pool = [];
  TYPES.forEach((t) => {
    if (mode !== "all" && mode !== t) return;
    (src.clean[t] || []).forEach((x) => pool.push(t + "|" + x));
    if (R.cheeky) (src.cheeky[t] || []).forEach((x) => pool.push(t + "|" + x));
  });
  return R.fresh("quackers", pool, DECK_SIZE).map((s) => { const i = s.indexOf("|"); return { t: s.slice(0, i), x: s.slice(i + 1) }; });
}

function deal(R, g) {
  const c = g.deck[g.i];
  const card = { t: c.t, n: g.i + 1, of: g.deck.length };
  if (c.t === "rather") [card.a, card.b] = c.x.split("|");
  else if (c.t === "fowl") { const on = g.roster.filter(R.connected); card.text = c.x.replace(/\{p\}/g, () => R.name(R.pick(on.length ? on : g.roster))); }
  else card.text = c.x;
  g.card = card; g.votes = {}; g.revealed = c.t === "fowl";
}

/** Fold the current card's votes into the running stats used for the awards. */
function tally(g) {
  if (g.counted === g.i) return;
  g.counted = g.i;
  const st = g.stats, v = g.votes, t = g.card.t;
  const bump = (k, p, n = 1) => { st[k][p] = (st[k][p] || 0) + n; };
  if (t === "likely") Object.values(v).forEach((p) => bump("pointed", p));
  if (t === "whowould") Object.values(v).forEach((p) => bump("loved", p));
  if (t === "never") Object.keys(v).forEach((p) => v[p] === "yes" && bump("guilty", p));
  if (t === "rather" || t === "hottake") {
    const counts = {}; Object.values(v).forEach((x) => (counts[x] = (counts[x] || 0) + 1));
    const opts = Object.keys(counts);
    if (opts.length === 2 && counts[opts[0]] !== counts[opts[1]]) {
      const minority = counts[opts[0]] < counts[opts[1]] ? opts[0] : opts[1];
      Object.keys(v).forEach((p) => v[p] === minority && bump("rebel", p));
    }
  }
}

function finish(R, g) {
  g.phase = "final";
  const top = (k) => {
    const e = Object.entries(g.stats[k]); if (!e.length) return null;
    const max = Math.max(...e.map((x) => x[1]));
    return { pids: e.filter((x) => x[1] === max).map((x) => x[0]), n: max };
  };
  g.awards = [
    ["pointed", "🫵 Most Pointed-At", "The flock's prime suspect"],
    ["loved", "💛 Flock Favourite", "Everyone's pick for everything"],
    ["guilty", "😈 Guiltiest Duck", "Has done… most of it"],
    ["rebel", "🦢 Rebel Duck", "Always in the minority"],
  ].map(([k, title, sub]) => { const t = top(k); return t ? { title, sub, pids: t.pids, n: t.n } : null; }).filter(Boolean);
  g.awards.forEach((a) => a.pids.forEach((p) => R.award(p, 1)));
}

export default {
  min: 2,
  start(R, roster, opts) {
    const g = { phase: "play", mode: TYPES.includes(opts.mode) ? opts.mode : "all", i: 0, roster, counted: -1, stats: { pointed: {}, loved: {}, guilty: {}, rebel: {} } };
    g.deck = build(R, g.mode);
    deal(R, g);
    return g;
  },
  act(R, g, pid, m) {
    if (g.phase !== "play") return;
    const t = g.card.t;
    switch (m.a) {
      case "vote": {
        if (g.revealed || t === "fowl") return;
        if ((t === "likely" || t === "whowould") && !g.roster.includes(m.v)) return;
        if (VALID[t] && !VALID[t].includes(m.v)) return;
        g.votes[pid] = m.v;
        if (g.roster.filter(R.connected).every((p) => g.votes[p] !== undefined)) { g.revealed = true; tally(g); }
        return;
      }
      case "reveal": g.revealed = true; tally(g); return;
      case "next":
        if (!g.revealed) tally(g);
        g.i++;
        if (g.i >= g.deck.length) finish(R, g); else deal(R, g);
        return;
    }
  },
  view(R, g, pid) {
    if (g.phase === "final") return { phase: "final", awards: g.awards, total: g.deck.length };
    return {
      phase: "play", mode: g.mode, card: g.card, revealed: g.revealed,
      voted: Object.keys(g.votes), myVote: g.votes[pid] ?? null,
      votes: g.revealed ? g.votes : null,
    };
  },
};
