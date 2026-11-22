/* Duck Duck Goose (online): everyone sees their own role on their own phone, and votes on it. */
export default {
  min: 3,
  start(R, roster, opts) {
    const pool = R.C.pool(R.C.goose, R.cheeky);
    const cat = opts.category && pool[opts.category] ? opts.category : R.pick(Object.keys(pool));
    const word = R.fresh("goose", pool[cat], 1)[0];
    const n = Math.min(opts.geese === 2 && roster.length >= 7 ? 2 : 1, roster.length - 1);
    return {
      phase: "clues", cat, word,
      choices: R.shuffle(pool[cat]),
      geese: R.shuffle(roster).slice(0, n),
      first: R.pick(roster),
      votes: {}, accused: null, outcome: null, guess: null, tally: null,
    };
  },

  act(R, g, pid, m, isHost) {
    const inGame = g.roster.includes(pid);
    switch (m.a) {
      case "toVote":
        if (g.phase === "clues" && (isHost || inGame)) g.phase = "vote";
        return;
      case "vote":
        if (g.phase !== "vote" || !inGame) return;
        if (!g.roster.includes(m.target) || m.target === pid) return "You can't vote for that duck.";
        g.votes[pid] = m.target;
        if (g.roster.filter(R.connected).every((p) => g.votes[p])) resolve(R, g);
        return;
      case "forceVote":
        if (g.phase === "vote" && isHost) resolve(R, g);
        return;
      case "guess":
        if (g.phase !== "guess" || pid !== g.accused) return;
        g.guess = String(m.word || "");
        finish(R, g, g.guess === g.word ? "stolen" : "caught");
        return;
    }
  },

  view(R, g, pid) {
    const goose = g.geese.includes(pid);
    const v = {
      phase: g.phase, cat: g.cat, first: g.first, geeseCount: g.geese.length,
      role: g.roster.includes(pid) ? (goose ? "goose" : "duck") : "spectator",
      word: goose ? null : g.word,
      voted: Object.keys(g.votes),
      myVote: g.votes[pid] || null,
      accused: g.accused,
    };
    if (g.phase === "guess" && pid === g.accused) v.choices = g.choices;
    if (g.phase === "result") Object.assign(v, { word: g.word, geese: g.geese, outcome: g.outcome, guess: g.guess, tally: g.tally });
    return v;
  },
};

function resolve(R, g) {
  const tally = {};
  Object.values(g.votes).forEach((t) => (tally[t] = (tally[t] || 0) + 1));
  g.tally = tally;
  const max = Math.max(0, ...Object.values(tally));
  const top = Object.keys(tally).filter((k) => tally[k] === max);
  if (top.length !== 1) return finish(R, g, "tie");
  g.accused = top[0];
  if (g.geese.includes(g.accused)) g.phase = "guess";
  else finish(R, g, "innocent");
}

function finish(R, g, outcome) {
  g.outcome = outcome; // caught = ducks win; stolen / tie / innocent = geese win
  g.phase = "result";
  if (outcome === "caught") g.roster.filter((p) => !g.geese.includes(p)).forEach((p) => R.award(p, 1));
  else g.geese.forEach((p) => R.award(p, 2));
}
