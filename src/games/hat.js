/* Duck in a Hat (online): words typed on your own phone; the clue-giver sees the word,
   and so do the OTHER teams (to police cheating). Everyone sees the clock. */
const ROUNDS = ["Describe It", "One Word Wonder", "Quack Charades"];

export default {
  min: 4,
  start(R, roster, opts) {
    const teamCount = Math.max(2, Math.min(4, +opts.teams || 2, Math.floor(roster.length / 2)));
    const perPlayer = [2, 3, 4, 5].includes(+opts.perPlayer) ? +opts.perPlayer : 3;
    const seconds = [30, 45, 60, 90].includes(+opts.seconds) ? +opts.seconds : 45;
    const names = R.shuffle(R.C.teamNames);
    const teams = Array.from({ length: teamCount }, (_, i) => ({ name: names[i], players: [], score: 0, giver: 0 }));
    R.shuffle(roster).forEach((p, i) => teams[i % teamCount].players.push(p));
    const g = { teams, perPlayer, seconds, words: [], wrote: {}, round: 0, teamPtr: 0, hat: [], cur: null, got: [], deadline: null, emptied: false };
    if (opts.source === "deck") { g.words = R.shuffle(R.C.pool(R.C.hat, R.cheeky)).slice(0, Math.max(12, perPlayer * roster.length)); g.phase = "round"; g.hat = R.shuffle(g.words); }
    else g.phase = "words";
    return g;
  },
  tick(R, g) { if (g.phase === "turn" && R.now() > g.deadline + 1500) endTurn(R, g, false); },
  act(R, g, pid, m, isHost) {
    const giver = currentGiver(g);
    switch (m.a) {
      case "words": {
        if (g.phase !== "words" || !g.roster.includes(pid) || g.wrote[pid]) return;
        const pool = R.C.pool(R.C.hat, R.cheeky);
        const ws = (Array.isArray(m.words) ? m.words : []).slice(0, g.perPlayer).map((w) => String(w || "").trim().slice(0, 40));
        while (ws.length < g.perPlayer) ws.push("");
        g.words.push(...ws.map((w) => w || R.pick(pool)));
        g.wrote[pid] = true;
        if (g.roster.filter(R.connected).every((p) => g.wrote[p])) toRounds(R, g);
        return;
      }
      case "forceWords":
        if (g.phase === "words" && isHost) {
          const pool = R.shuffle(R.C.pool(R.C.hat, R.cheeky));
          g.roster.forEach((p) => { if (!g.wrote[p]) g.words.push(...pool.splice(0, g.perPlayer)); });
          toRounds(R, g);
        }
        return;
      case "go":
        if (g.phase === "round") g.phase = "ready";
        return;
      case "startTurn":
        if (g.phase !== "ready" || (pid !== giver && !isHost)) return;
        g.phase = "turn"; g.got = []; g.cur = g.hat.shift(); g.deadline = R.now() + g.seconds * 1000;
        R.later(g.seconds * 1000, () => { if (g.phase === "turn") endTurn(R, g, false); });
        return;
      case "got":
        if (g.phase !== "turn" || pid !== giver || m.word !== g.cur) return;
        g.got.push(g.cur);
        if (!g.hat.length) { g.cur = null; endTurn(R, g, true); }
        else g.cur = g.hat.shift();
        return;
      case "skip":
        if (g.phase !== "turn" || pid !== giver || m.word !== g.cur || !g.hat.length) return;
        g.hat.push(g.cur); g.cur = g.hat.shift();
        return;
      case "skipGiver":
        if (g.phase === "ready" && isHost) { const t = g.teams[g.teamPtr]; t.giver++; }
        return;
      case "next":
        if (g.phase !== "summary") return;
        if (!g.emptied) g.phase = "ready";
        else if (g.round < 2) { g.round++; g.hat = R.shuffle(g.words); g.phase = "round"; }
        else g.phase = "final";
        return;
    }
  },
  view(R, g, pid) {
    const giver = currentGiver(g);
    const myTeam = g.teams.findIndex((t) => t.players.includes(pid));
    const v = {
      phase: g.phase, round: g.round, roundName: ROUNDS[g.round], perPlayer: g.perPlayer, seconds: g.seconds,
      teams: g.teams.map((t) => ({ name: t.name, players: t.players, score: t.score })),
      teamPtr: g.teamPtr, giver, myTeam, wrote: Object.keys(g.wrote), hatSize: g.hat.length + (g.cur ? 1 : 0),
      deadline: g.deadline, got: g.got, emptied: g.emptied, lastTeam: g.lastTeam,
    };
    // The giver sees the word; the other teams see it too so they can heckle. The giver's own team doesn't.
    if (g.phase === "turn" && (pid === giver || myTeam !== g.teamPtr)) v.word = g.cur;
    return v;
  },
};

function currentGiver(g) {
  const t = g.teams[g.teamPtr];
  return t.players[t.giver % t.players.length];
}
function toRounds(R, g) { g.hat = R.shuffle(g.words); g.phase = "round"; }
function endTurn(R, g, emptied) {
  R.clearLater();
  if (!emptied && g.cur != null) g.hat.push(g.cur);
  g.cur = null;
  g.hat = R.shuffle(g.hat);
  const t = g.teams[g.teamPtr];
  t.score += g.got.length;
  t.players.forEach((p) => R.award(p, g.got.length));
  t.giver++;
  g.lastTeam = g.teamPtr;
  g.teamPtr = (g.teamPtr + 1) % g.teams.length;
  g.emptied = emptied;
  g.deadline = null;
  g.phase = "summary";
}
