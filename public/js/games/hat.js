/* Duck in a Hat — the hat game / fishbowl / celebrity, with ducks. */
(function () {
  const { $, $$, esc, render, shuffle, pick, content } = App;

  const ROUNDS = [
    { name: "Describe It", rule: "Say anything you like — except the word itself (or bits of it). No 'sounds like', no spelling.", look: { hat: "top", mood: "happy" } },
    { name: "One Word Wonder", rule: "Exactly ONE word per clue. Choose wisely. Pointing and pleading eyes are allowed.", look: { hat: "shades", mood: "sly", body: "#7FDBFF" } },
    { name: "Quack Charades", rule: "Act it out. The ONLY sound you can make is QUACK. Interpretive waddling encouraged.", look: { hat: "party", mood: "happy", quack: true, body: "#FF9EC4" } },
  ];

  let G;

  function start() {
    const n = App.state.players.length;
    G = { teamCount: n >= 8 ? 3 : 2, perPlayer: 3, seconds: 45, source: "flock" };
    makeTeams();
    setup();
  }

  function makeTeams() {
    const names = shuffle(content.teamNames);
    const order = shuffle(App.state.players.map((_, i) => i));
    G.teams = Array.from({ length: G.teamCount }, (_, t) => ({ name: names[t], players: [], score: 0, giver: 0 }));
    order.forEach((p, i) => G.teams[i % G.teamCount].players.push(p));
  }

  function setup() {
    const n = App.state.players.length, maxTeams = Math.max(2, Math.min(4, Math.floor(n / 2)));
    const P = App.state.players;
    render(`${App.topbar("Duck in a Hat", "Setup")}
      <section class="screen">
        <div class="field"><label>Teams</label>${App.chooser("teamCount", Array.from({ length: maxTeams - 1 }, (_, i) => i + 2), G.teamCount)}</div>
        <div class="field"><label>Where do the words come from?</label>${App.chooser("source", [["flock", "✍️ Everyone writes"], ["deck", "🎲 Duck Deck"]], G.source)}</div>
        <div class="field"><label>${G.source === "flock" ? "Words per duck" : "Words in the hat"}</label>${App.chooser("perPlayer", [3, 4, 5], G.perPlayer)}</div>
        <div class="field"><label>Seconds per turn</label>${App.chooser("seconds", [30, 45, 60, 90], G.seconds)}</div>
        <h3 class="section-title">The teams <button class="btn btn-small" id="reshuffle">🔀 Reshuffle</button></h3>
        <div class="teams">${G.teams.map((t, i) => `<div class="team t${i}"><strong>${esc(t.name)}</strong>
          <div class="team-ducks">${t.players.map((p) => `<span class="tdk">${App.duckFor(P[p])}<em>${esc(P[p].name)}</em></span>`).join("")}</div></div>`).join("")}</div>
        <button class="btn btn-primary btn-xl" id="go">Fill the hat</button>
      </section>`, (el) => {
      App.wireChoosers(el, (k, v) => {
        G[k] = k === "source" ? v : +v;
        if (k === "teamCount") makeTeams();
        setup();
      });
      $("#reshuffle", el).onclick = () => { makeTeams(); App.sound.quack(); setup(); };
      $("#go", el).onclick = () => {
        G.words = [];
        if (G.source === "deck") {
          G.words = shuffle(content.pool(content.hat)).slice(0, Math.max(12, G.perPlayer * n));
          rounds(0);
        } else collect(0);
      };
    });
  }

  function collect(i) {
    const P = App.state.players;
    if (i >= P.length) { rounds(0); return; }
    App.handoff(P[i], `Time to secretly write ${G.perPlayer} things for the hat. People, places, films, filth — anything the flock might know.`, () => {
      render(`${App.topbar("Duck in a Hat", `Words from ${esc(P[i].name)}`)}
        <section class="screen">
          <p class="lead">Write ${G.perPlayer} words or names. Stuck? Hit the dice.</p>
          <form id="f">${Array.from({ length: G.perPlayer }, (_, k) => `
            <div class="word-row"><input name="w${k}" maxlength="40" autocomplete="off" placeholder="Thing #${k + 1}"><button type="button" class="icon-btn" data-dice="${k}" aria-label="Random word">🎲</button></div>`).join("")}
            <button class="btn btn-primary btn-xl" type="submit">Into the hat ${i + 1 < P.length ? "& pass on" : "— let's go"}</button>
          </form>
        </section>`, (el) => {
        const pool = content.pool(content.hat);
        $$("[data-dice]", el).forEach((b) => (b.onclick = () => { $(`[name=w${b.dataset.dice}]`, el).value = pick(pool); App.sound.pop(); }));
        $("#f", el).onsubmit = (e) => {
          e.preventDefault();
          $$("input", el).forEach((inp) => G.words.push(inp.value.trim() || pick(pool)));
          collect(i + 1);
        };
      });
    }, { title: "Duck in a Hat" });
  }

  function rounds(r) {
    G.round = r;
    G.hat = shuffle(G.words);
    if (r === 0) G.teamPtr = 0;
    const R = ROUNDS[r];
    App.sound.quack();
    render(`${App.topbar("Duck in a Hat", `Round ${r + 1} of 3`)}
      <section class="screen center">
        <p class="eyebrow">Round ${r + 1}</p>
        <div class="hero-duck bob">${App.duck(R.look)}</div>
        <h1>${R.name}</h1>
        <p class="rule">${R.rule}</p>
        <p class="muted">${G.hat.length} words in the hat. Every word gets used every round.</p>
        <button class="btn btn-primary btn-xl" id="go">Let's go</button>
      </section>`, (el) => ($("#go", el).onclick = turnReady));
  }

  function turnReady() {
    const team = G.teams[G.teamPtr], P = App.state.players;
    const giver = P[team.players[team.giver % team.players.length]];
    render(`${App.topbar("Duck in a Hat", `${ROUNDS[G.round].name} · ${G.hat.length} left`)}
      <section class="screen center">
        <p class="eyebrow team-label t${G.teamPtr}">${esc(team.name)}</p>
        <div class="hero-duck bob">${App.duckFor(giver, { mood: "happy" })}</div>
        <h1>${esc(giver.name)}, you're up</h1>
        <p class="lead">Grab the phone. Your team guesses. Everyone else heckles.</p>
        <p class="rule small">${ROUNDS[G.round].rule}</p>
        <button class="btn btn-primary btn-xl" id="go">Start ${G.seconds}s</button>
      </section>`, (el) => ($("#go", el).onclick = () => play(team, giver)));
  }

  function play(team, giver) {
    let got = [], current = G.hat.shift(), ended = false;
    render(`${App.topbar("Duck in a Hat", esc(team.name))}
      <section class="screen play">
        ${App.timerBar()}
        <div class="word-card" id="card"><span class="wc-label">Your word</span><span id="word"></span></div>
        <p class="center muted" id="count">0 got so far · ${G.hat.length + 1} in the hat</p>
        <div class="play-btns">
          <button class="btn btn-bad btn-xl" id="skip">Skip ⏭</button>
          <button class="btn btn-good btn-xl" id="got">Got it! ✅</button>
        </div>
        <button class="btn btn-ghost" id="pause">⏸ Pause</button>
      </section>`, (el) => {
      const show = () => {
        $("#word", el).textContent = current;
        const c = $("#card", el); c.classList.remove("flip"); void c.offsetWidth; c.classList.add("flip");
        $("#count", el).textContent = `${got.length} got so far · ${G.hat.length + 1} in the hat`;
      };
      show();
      const finish = (emptied) => {
        if (ended) return; ended = true; timer.stop();
        if (!emptied && current != null) G.hat.push(current);
        G.hat = shuffle(G.hat);
        team.score += got.length;
        summary(team, giver, got, emptied);
      };
      const timer = App.timer(G.seconds, (rem, frac) => App.updateTimerBar(el, rem, frac), () => { App.sound.honk(); finish(false); });
      $("#got", el).onclick = () => {
        got.push(current); App.sound.good();
        if (!G.hat.length) { current = null; finish(true); return; }
        current = G.hat.shift(); show();
      };
      $("#skip", el).onclick = () => {
        if (!G.hat.length) return; // nothing else to show
        App.sound.quack(0.8);
        G.hat.push(current); current = G.hat.shift(); show();
      };
      $("#pause", el).onclick = (e) => {
        if (timer.paused) { timer.resume(); e.target.textContent = "⏸ Pause"; $("#card", el).classList.remove("hidden"); }
        else { timer.pause(); e.target.textContent = "▶ Resume"; $("#card", el).classList.add("hidden"); }
      };
    });
  }

  function summary(team, giver, got, emptied) {
    const nextRound = emptied;
    team.giver++;
    G.teamPtr = (G.teamPtr + 1) % G.teams.length;
    render(`${App.topbar("Duck in a Hat", emptied ? "The hat is empty!" : "Time's up!")}
      <section class="screen center">
        <div class="hero-duck">${App.duckFor(giver, { mood: got.length >= 5 ? "happy" : got.length ? "normal" : "dead" })}</div>
        <h1>${got.length} ${got.length === 1 ? "point" : "points"} for ${esc(team.name)}</h1>
        <p class="lead">${got.length === 0 ? "Absolutely nothing. A sitting duck." : got.length >= 6 ? "Unstoppable. Ducking magnificent." : "Not bad, not bad."}</p>
        ${got.length ? `<div class="got-list">${got.map((w) => `<span class="chip on">${esc(w)}</span>`).join("")}</div>` : ""}
        ${App.scoreboard(G.teams.map((t) => ({ name: t.name, score: t.score })))}
        <button class="btn btn-primary btn-xl" id="go">${nextRound ? (G.round < 2 ? `On to Round ${G.round + 2}` : "Final results") : "Next team"}</button>
      </section>`, (el) => {
      $("#go", el).onclick = () => {
        if (!nextRound) turnReady();
        else if (G.round < 2) rounds(G.round + 1);
        else final();
      };
    });
  }

  function final() {
    const sorted = G.teams.slice().sort((a, b) => b.score - a.score);
    const tie = sorted[1] && sorted[0].score === sorted[1].score;
    App.sound.win(); App.confetti();
    App.state.inGame = false;
    render(`${App.topbar("Duck in a Hat", "Game over")}
      <section class="screen center">
        <div class="hero-duck bob">${App.duck({ hat: "crown", mood: "happy" })}</div>
        <h1>${tie ? "It's a tie! Everybody's a winner (nobody is)." : `${esc(sorted[0].name)} win!`}</h1>
        ${App.scoreboard(G.teams.map((t) => ({ name: t.name, score: t.score })))}
        <button class="btn btn-primary btn-xl" id="again">Play again</button>
        <button class="btn" data-home>Back to the pond</button>
      </section>`, (el) => ($("#again", el).onclick = () => { App.state.inGame = true; start(); }));
  }

  App.games.hat = { start };
})();
