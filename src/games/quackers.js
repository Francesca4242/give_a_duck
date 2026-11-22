/* Quackers (online): one shared card; everyone votes on their own phone, then the results are revealed. */
const TYPES = ["likely", "never", "rather", "fowl"];

function build(R, mode) {
  const src = R.C.quackers, deck = [];
  TYPES.forEach((t) => {
    if (mode !== "all" && mode !== t) return;
    src.clean[t].forEach((x) => deck.push({ t, x }));
    if (R.cheeky) src.cheeky[t].forEach((x) => deck.push({ t, x }));
  });
  return R.shuffle(deck);
}

function deal(R, g) {
  if (g.i >= g.deck.length) { g.deck = R.shuffle(g.deck); g.i = 0; }
  const c = g.deck[g.i];
  const card = { t: c.t, n: g.n++ };
  if (c.t === "rather") [card.a, card.b] = c.x.split("|");
  else if (c.t === "fowl") card.text = c.x.replace(/\{p\}/g, () => R.name(R.pick(g.roster.filter(R.connected).length ? g.roster.filter(R.connected) : g.roster)));
  else card.text = c.x;
  g.card = card; g.votes = {}; g.revealed = c.t === "fowl";
}

export default {
  min: 2,
  start(R, roster, opts) {
    const g = { mode: opts.mode || "all", i: 0, n: 1 };
    g.deck = build(R, g.mode);
    g.roster = roster;
    deal(R, g);
    return g;
  },
  act(R, g, pid, m) {
    switch (m.a) {
      case "vote": {
        if (g.revealed || g.card.t === "fowl") return;
        const v = m.v;
        if (g.card.t === "likely" && !g.roster.includes(v)) return;
        if (g.card.t === "rather" && v !== "a" && v !== "b") return;
        if (g.card.t === "never" && v !== "yes" && v !== "no") return;
        g.votes[pid] = v;
        if (g.roster.filter(R.connected).every((p) => g.votes[p] !== undefined)) g.revealed = true;
        return;
      }
      case "reveal": g.revealed = true; return;
      case "next": g.i++; deal(R, g); return;
      case "mode":
        g.mode = TYPES.includes(m.mode) ? m.mode : "all";
        g.deck = build(R, g.mode); g.i = 0; deal(R, g);
        return;
    }
  },
  view(R, g, pid) {
    return {
      mode: g.mode, card: g.card, revealed: g.revealed,
      voted: Object.keys(g.votes), myVote: g.votes[pid] ?? null,
      votes: g.revealed ? g.votes : null,
    };
  },
};
