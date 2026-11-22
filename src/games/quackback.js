/* Quack Back (online): everyone answers cheeky prompts in secret. Each prompt goes to two ducks;
   their answers go head-to-head and the rest of the flock votes. Two rounds, then the Last Quack. */
const WRITE_SECS = 90, VOTE_SECS = 25, RESULT_SECS = 9;
const FILLERS = ["Quack.", "…I panicked.", "Bread?", "*waddles away*", "No comment, officer.", "Honk."];

function setupRound(R, g) {
  const n = g.roster.length;
  g.answered = {};
  if (g.round < 2) {
    const prompts = R.fresh("quackback", R.C.pool(R.C.quackback, R.cheeky), n);
    g.matchups = prompts.map((prompt, i) => ({ prompt, a: g.roster[i], b: g.roster[(i + 1) % n], ans: {}, votes: {} }));
  } else {
    g.last = { prompt: R.fresh("quackback", R.C.pool(R.C.quackback, R.cheeky), 1)[0], ans: {}, votes: {} };
  }
  g.phase = "write";
  g.deadline = R.now() + WRITE_SECS * 1000;
  R.later(WRITE_SECS * 1000 + 2000, () => toVote(R, g));
}

function myMatchups(g, pid) { return g.matchups.map((m, i) => ({ m, i })).filter(({ m }) => m.a === pid || m.b === pid); }
function doneWriting(g, pid) {
  if (g.round === 2) return g.last.ans[pid] !== undefined;
  return myMatchups(g, pid).every(({ m }) => m.ans[pid] !== undefined);
}

function toVote(R, g) {
  if (g.phase !== "write") return;
  if (g.round < 2) {
    g.matchups.forEach((m) => [m.a, m.b].forEach((p) => { if (m.ans[p] === undefined) m.ans[p] = R.pick(FILLERS); }));
    g.order = R.shuffle(g.matchups.map((_, i) => i));
    g.vi = 0;
  } else {
    g.roster.forEach((p) => { if (g.last.ans[p] === undefined && R.connected(p)) g.last.ans[p] = R.pick(FILLERS); });
    g.lastOrder = R.shuffle(Object.keys(g.last.ans));
  }
  startVote(R, g);
}

function startVote(R, g) {
  g.phase = "vote";
  g.deadline = R.now() + VOTE_SECS * 1000;
  R.later(VOTE_SECS * 1000 + 1500, () => reveal(R, g));
}

function voters(R, g) {
  if (g.round === 2) return g.roster.filter((p) => R.connected(p));
  const m = g.matchups[g.order[g.vi]];
  return g.roster.filter((p) => p !== m.a && p !== m.b && R.connected(p));
}

function reveal(R, g) {
  if (g.phase !== "vote") return;
  const mult = g.round + 1;
  g.phase = "result"; g.deadline = null;
  const add = (p, n) => { g.scores[p] = (g.scores[p] || 0) + n; R.award(p, Math.round(n / 100)); };
  if (g.round < 2) {
    const m = g.matchups[g.order[g.vi]];
    const va = Object.values(m.votes).filter((x) => x === "a").length, vb = Object.values(m.votes).filter((x) => x === "b").length;
    m.points = { a: va * 100 * mult, b: vb * 100 * mult };
    m.quackout = va + vb > 0 && (va === 0 || vb === 0) ? (va ? "a" : "b") : null;
    if (m.quackout) m.points[m.quackout] += 100 * mult;
    add(m.a, m.points.a); add(m.b, m.points.b);
  } else {
    const counts = {};
    Object.values(g.last.votes).forEach((p) => (counts[p] = (counts[p] || 0) + 1));
    g.last.counts = counts;
    Object.entries(counts).forEach(([p, n]) => add(p, n * 300));
  }
  R.later(RESULT_SECS * 1000, () => next(R, g));
}

function next(R, g) {
  if (g.phase === "result") {
    if (g.round < 2 && g.vi < g.order.length - 1) { g.vi++; startVote(R, g); return; }
    R.clearLater();
    g.phase = g.round < 2 ? "scores" : "final";
    return;
  }
  if (g.phase === "scores") { g.round++; setupRound(R, g); }
}

export default {
  min: 3,
  start(R, roster) {
    const g = { roster, round: 0, scores: {} };
    setupRound(R, g);
    return g;
  },
  tick(R, g) {
    if (g.deadline && R.now() > g.deadline + 3000) {
      if (g.phase === "write") toVote(R, g);
      else if (g.phase === "vote") reveal(R, g);
    }
  },
  act(R, g, pid, m, isHost) {
    const inGame = g.roster.includes(pid);
    switch (m.a) {
      case "answer": {
        if (g.phase !== "write" || !inGame) return;
        const text = String(m.text || "").trim().slice(0, 80);
        if (!text) return "Write something! Even 'quack' counts.";
        if (g.round === 2) g.last.ans[pid] = text;
        else {
          const mu = g.matchups[m.idx];
          if (!mu || (mu.a !== pid && mu.b !== pid)) return;
          mu.ans[pid] = text;
        }
        if (g.roster.filter(R.connected).every((p) => doneWriting(g, p))) { R.clearLater(); toVote(R, g); }
        return;
      }
      case "vote": {
        if (g.phase !== "vote" || !voters(R, g).includes(pid)) return;
        if (g.round === 2) {
          if (!g.last.ans[m.pick] || m.pick === pid) return;
          g.last.votes[pid] = m.pick;
        } else {
          if (m.pick !== "a" && m.pick !== "b") return;
          g.matchups[g.order[g.vi]].votes[pid] = m.pick;
        }
        const vs = voters(R, g), votes = g.round === 2 ? g.last.votes : g.matchups[g.order[g.vi]].votes;
        if (vs.every((p) => votes[p])) { R.clearLater(); reveal(R, g); }
        return;
      }
      case "next":
        if ((g.phase === "result" || g.phase === "scores") && (isHost || g.phase === "scores")) next(R, g);
        return;
      case "forceVote":
        if (isHost && g.phase === "write") { R.clearLater(); toVote(R, g); }
        return;
    }
  },
  view(R, g, pid) {
    const v = { phase: g.phase, round: g.round, deadline: g.deadline, scores: g.scores };
    if (g.phase === "write") {
      v.done = g.roster.filter((p) => doneWriting(g, p));
      if (g.round === 2) v.prompts = [{ idx: 0, prompt: g.last.prompt, answered: g.last.ans[pid] !== undefined }];
      else v.prompts = myMatchups(g, pid).map(({ m, i }) => ({ idx: i, prompt: m.prompt, answered: m.ans[pid] !== undefined }));
    }
    if (g.phase === "vote" || g.phase === "result") {
      v.canVote = voters(R, g).includes(pid);
      if (g.round === 2) {
        v.prompt = g.last.prompt;
        v.options = g.lastOrder.map((p) => ({ id: p, text: g.last.ans[p], by: g.phase === "result" ? p : null, votes: g.phase === "result" ? g.last.counts[p] || 0 : null, mine: p === pid }));
        v.myVote = g.last.votes[pid] || null;
        v.voted = Object.keys(g.last.votes);
      } else {
        const m = g.matchups[g.order[g.vi]];
        v.prompt = m.prompt; v.n = g.vi + 1; v.of = g.order.length;
        v.a = { text: m.ans[m.a], mine: m.a === pid }; v.b = { text: m.ans[m.b], mine: m.b === pid };
        v.myVote = m.votes[pid] || null;
        v.voted = Object.keys(m.votes);
        if (g.phase === "result") {
          Object.assign(v.a, { by: m.a, voters: Object.keys(m.votes).filter((p) => m.votes[p] === "a"), points: m.points.a });
          Object.assign(v.b, { by: m.b, voters: Object.keys(m.votes).filter((p) => m.votes[p] === "b"), points: m.points.b });
          v.quackout = m.quackout;
        }
      }
    }
    return v;
  },
};
