/* Pecking Order — one duck secretly ranks five things, the flock guesses the order. */
(function () {
  const { $, $$, esc, render, shuffle, content } = App;
  let G;

  const FRAMES = [
    ["😍 LOVE IT", "🤮 LOATHE IT"],
    ["🔥 Would do tonight", "🙅 Not for a million quid"],
    ["🍞 Better than bread", "🪨 Worse than a soggy crust"],
    ["🛟 Save first", "🔥 Let it burn"],
  ];

  function start() {
    G = { laps: 1, ranker: 0, scores: {}, flock: 0, max: 0 };
    G.order = shuffle(App.state.players.map((_, i) => i));
    G.deck = shuffle(content.pool(content.pecking));
    setup();
  }

  function setup() {
    render(`${App.topbar("Pecking Order", "Setup")}
      <section class="screen">
        <div class="center"><div class="hero-duck small bob">${App.duck({ body: "#FF9EC4", hat: "crown", mood: "sly" })}</div></div>
        <p class="lead">Each turn one duck is the <b>Top Duck</b>. They secretly rank five things. Then the rest of the flock argues about what order they picked. One point per thing in the right spot.</p>
        <div class="field"><label>Turns each</label>${App.chooser("laps", [1, 2, 3], G.laps)}</div>
        <button class="btn btn-primary btn-xl" id="go">Establish the pecking order</button>
      </section>`, (el) => {
      App.wireChoosers(el, (k, v) => (G[k] = +v));
      $("#go", el).onclick = turn;
    });
  }

  function turn() {
    const P = App.state.players;
    if (G.ranker >= G.order.length * G.laps) { final(); return; }
    const p = P[G.order[G.ranker % G.order.length]];
    if (G.deck.length < 5) G.deck = shuffle(content.pool(content.pecking));
    const items = G.deck.splice(0, 5), frame = FRAMES[G.ranker % FRAMES.length];
    App.handoff(p, "You're Top Duck. Rank these five things in secret.", () => {
      ranker(items, frame, `${esc(p.name)}'s secret ranking`, "Tap them in order, top first.", "Lock it in", (secret) => {
        render(`${App.topbar("Pecking Order", "Pass to the flock")}
          <section class="screen center">
            <div class="hero-duck bob">${App.duckFor(p, { mood: "sly" })}</div>
            <h1>Locked in.</h1>
            <p class="lead">Hand the phone to the rest of the flock. ${esc(p.name)}: poker face. No hints. (Maybe one eyebrow.)</p>
            <button class="btn btn-primary btn-xl" id="go">We're the flock, let us guess</button>
          </section>`, (el) => ($("#go", el).onclick = () => {
          ranker(shuffle(items), frame, `How did ${esc(p.name)} rank them?`, "Argue amongst yourselves, then tap in your group answer.", "Final answer", (guess) => score(p, secret, guess, frame));
        }));
      });
    }, { title: "Pecking Order", sub: `Turn ${G.ranker + 1} of ${G.order.length * G.laps}` });
  }

  /** Tap-to-order component. */
  function ranker(items, frame, title, hint, cta, done) {
    let order = [];
    const draw = () => render(`${App.topbar("Pecking Order", title)}
      <section class="screen">
        <h2 class="center">${title}</h2>
        <p class="muted center">${hint}</p>
        <p class="frame top">${frame[0]}</p>
        <div class="rank-list">${items.map((it) => {
          const pos = order.indexOf(it);
          return `<button class="rank-item ${pos >= 0 ? "on" : ""}" data-it="${esc(it)}"><span class="badge">${pos >= 0 ? pos + 1 : ""}</span>${esc(it)}</button>`;
        }).join("")}</div>
        <p class="frame bottom">${frame[1]}</p>
        <div class="play-btns">
          <button class="btn" id="reset" ${order.length ? "" : "disabled"}>Start over</button>
          <button class="btn btn-primary" id="done" ${order.length === items.length ? "" : "disabled"}>${cta}</button>
        </div>
      </section>`, (el) => {
      $$(".rank-item", el).forEach((b) => (b.onclick = () => {
        const it = items.find((x) => x === b.dataset.it || esc(x) === b.dataset.it);
        const at = order.indexOf(it);
        if (at >= 0) order.splice(at, 1); else order.push(it);
        App.sound.pop(); draw();
      }));
      $("#reset", el).onclick = () => { order = []; draw(); };
      $("#done", el).onclick = () => done(order.slice());
    });
    draw();
  }

  function score(p, secret, guess, frame) {
    const hits = secret.filter((it, i) => guess[i] === it).length;
    G.scores[p.name] = (G.scores[p.name] || 0) + hits;
    G.flock += hits; G.max += 5; G.ranker++;
    if (hits === 5) { App.sound.win(); App.confetti(); } else if (hits >= 3) App.sound.good(); else App.sound.bad();
    const verdict = ["Total strangers. Have you even met?", "One. Barely acquainted.", "Two. Pond acquaintances.", "Three! Solid flock energy.", "Four! Practically nesting together.", "PERFECT PECKING ORDER! 🏆"][hits];
    render(`${App.topbar("Pecking Order", "The reveal")}
      <section class="screen">
        <div class="center"><div class="hero-duck small bob">${App.duckFor(p, { mood: hits >= 3 ? "happy" : "shock" })}</div></div>
        <h1 class="center">${hits} / 5</h1>
        <p class="lead center">${verdict}</p>
        <p class="frame top">${frame[0]}</p>
        <ol class="compare">${secret.map((it, i) => `<li class="${guess[i] === it ? "hit" : "miss"}"><span class="badge">${i + 1}</span><span class="c-real">${esc(it)}</span><span class="c-guess">${guess[i] === it ? "✅" : `you said: ${esc(guess[i])}`}</span></li>`).join("")}</ol>
        <p class="frame bottom">${frame[1]}</p>
        <button class="btn btn-primary btn-xl" id="go">${G.ranker >= G.order.length * G.laps ? "Final results" : "Next Top Duck"}</button>
      </section>`, (el) => ($("#go", el).onclick = turn));
  }

  function final() {
    const P = App.state.players;
    App.state.inGame = false;
    const rows = P.map((p) => ({ name: p.name, score: G.scores[p.name] || 0, duck: App.duckFor(p) }));
    const sorted = rows.slice().sort((a, b) => b.score - a.score);
    App.sound.win(); App.confetti();
    render(`${App.topbar("Pecking Order", "Game over")}
      <section class="screen center">
        <div class="hero-duck bob">${App.duck({ hat: "crown", mood: "happy", body: "#FF9EC4" })}</div>
        <h1>The flock scored ${G.flock} / ${G.max}</h1>
        <p class="lead">📖 Most readable duck: <b>${esc(sorted[0].name)}</b><br>🕵️ Most mysterious duck: <b>${esc(sorted[sorted.length - 1].name)}</b></p>
        <p class="muted">Points = how well the flock read each Top Duck.</p>
        ${App.scoreboard(rows)}
        <button class="btn btn-primary btn-xl" id="again">Play again</button>
        <button class="btn" data-home>Back to the pond</button>
      </section>`, (el) => ($("#again", el).onclick = () => { App.state.inGame = true; start(); }));
  }

  App.games.pecking = { start };
})();
