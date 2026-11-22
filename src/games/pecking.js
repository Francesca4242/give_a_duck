/* Pecking Order (online): the Top Duck ranks in secret; everyone else guesses on their own phone. */
const FRAMES = [
  ["😍 LOVE IT", "🤮 LOATHE IT"],
  ["🔥 Would do tonight", "🙅 Not for a million quid"],
  ["🍞 Better than bread", "🪨 Worse than a soggy crust"],
  ["🛟 Save first", "🔥 Let it burn"],
];

function deal(R, g) {
  if (g.deck.length < 5) g.deck = R.shuffle(R.C.pool(R.C.pecking, R.cheeky));
  g.items = g.deck.splice(0, 5);
  g.frame = FRAMES[g.turn % FRAMES.length];
  g.ranker = g.order[g.turn % g.order.length];
  g.secret = null; g.guesses = {}; g.phase = "rank"; g.hits = null;
}
const isPerm = (a, items) => Array.isArray(a) && a.length === items.length && items.every((x) => a.includes(x));

export default {
  min: 3,
  start(R, roster, opts) {
    const g = { laps: [1, 2, 3].includes(+opts.laps) ? +opts.laps : 1, turn: 0, order: R.shuffle(roster), deck: R.shuffle(R.C.pool(R.C.pecking, R.cheeky)), roundScores: {} };
    deal(R, g);
    return g;
  },
  act(R, g, pid, m, isHost) {
    const guessers = () => g.roster.filter((p) => p !== g.ranker);
    switch (m.a) {
      case "rank":
        if (g.phase !== "rank" || pid !== g.ranker || !isPerm(m.order, g.items)) return;
        g.secret = m.order.slice(); g.phase = "guess";
        return;
      case "guess":
        if (g.phase !== "guess" || pid === g.ranker || !g.roster.includes(pid) || !isPerm(m.order, g.items)) return;
        g.guesses[pid] = m.order.slice();
        if (guessers().filter(R.connected).every((p) => g.guesses[p])) reveal(R, g);
        return;
      case "forceReveal":
        if (g.phase === "guess" && (isHost || pid === g.ranker) && Object.keys(g.guesses).length) reveal(R, g);
        return;
      case "skipRanker":
        if (g.phase === "rank" && isHost) { g.turn++; next(R, g); }
        return;
      case "next":
        if (g.phase === "reveal" && (isHost || pid === g.ranker)) { g.turn++; next(R, g); }
        return;
    }
  },
  view(R, g, pid) {
    return {
      phase: g.phase, turn: g.turn, total: g.order.length * g.laps, ranker: g.ranker, frame: g.frame,
      items: g.items,
      // the ranker's order is secret until the reveal (the ranker can see their own)
      secret: g.phase === "reveal" || pid === g.ranker ? g.secret : null,
      guessed: Object.keys(g.guesses),
      myGuess: g.guesses[pid] || null,
      guesses: g.phase === "reveal" ? g.guesses : null,
      hits: g.hits,
      roundScores: g.roundScores,
    };
  },
};

function reveal(R, g) {
  g.hits = {};
  let total = 0, n = 0;
  for (const [p, order] of Object.entries(g.guesses)) {
    const h = g.secret.filter((it, i) => order[i] === it).length;
    g.hits[p] = h; total += h; n++;
    R.award(p, h);
    g.roundScores[p] = (g.roundScores[p] || 0) + h;
  }
  const rankerPts = n ? Math.round(total / n) : 0; // the Top Duck scores how readable they were
  R.award(g.ranker, rankerPts);
  g.roundScores[g.ranker] = (g.roundScores[g.ranker] || 0) + rankerPts;
  g.hits[g.ranker] = rankerPts;
  g.phase = "reveal";
}

function next(R, g) {
  if (g.turn >= g.order.length * g.laps) { g.phase = "final"; return; }
  deal(R, g);
}
