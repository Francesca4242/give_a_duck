/* Duck Duck Goose — hidden imposter. Ducks know the word; the Goose only knows the category. */
(function () {
  const { $, $$, esc, render, shuffle, pick, content } = App;
  let G;
  const scores = {}; // name -> points, kept across rounds in a session

  function start() {
    G = { geese: 1, category: "random", minutes: 3 };
    setup();
  }

  function setup() {
    const n = App.state.players.length;
    const cats = Object.keys(content.pool(content.goose));
    render(`${App.topbar("Duck Duck Goose", "Setup")}
      <section class="screen">
        <div class="center"><div class="hero-duck small bob">${App.duck({ goose: true, mood: "sly" })}</div></div>
        <p class="lead">Everyone secretly sees the same word — except the <b>Goose</b>, who only gets the category. Go round giving one-word clues. Then vote out the Goose before it blends in.</p>
        <div class="field"><label>Geese</label>${App.chooser("geese", n >= 7 ? [1, 2] : [1], G.geese)}</div>
        <div class="field"><label>Category</label>${App.chooser("category", [["random", "🎲 Surprise me"]].concat(cats.map((c) => [c, c])), G.category)}</div>
        <div class="field"><label>Discussion timer</label>${App.chooser("minutes", [[0, "None"], [2, "2 min"], [3, "3 min"], [5, "5 min"]], G.minutes)}</div>
        <button class="btn btn-primary btn-xl" id="go">Deal the roles</button>
      </section>`, (el) => {
      App.wireChoosers(el, (k, v) => { G[k] = k === "category" ? v : +v; });
      $("#go", el).onclick = deal;
    });
  }

  function deal() {
    const P = App.state.players, pool = content.pool(content.goose);
    G.cat = G.category === "random" || !pool[G.category] ? pick(Object.keys(pool)) : G.category;
    G.word = pick(pool[G.cat]);
    G.geeseIdx = shuffle(P.map((_, i) => i)).slice(0, G.geese);
    reveal(0);
  }

  function reveal(i) {
    const P = App.state.players;
    if (i >= P.length) { clues(); return; }
    const p = P[i], isGoose = G.geeseIdx.includes(i);
    App.handoff(p, "Peek at your secret role, then hide it and pass the phone on.", () => {
      render(`${App.topbar("Duck Duck Goose", `Role ${i + 1} of ${P.length}`)}
        <section class="screen center role ${isGoose ? "is-goose" : "is-duck"}">
          <div class="hero-duck bob">${isGoose ? App.duck({ goose: true, mood: "sly", hat: p.look.hat }) : App.duckFor(p, { mood: "happy" })}</div>
          ${isGoose
            ? `<h1>You're the GOOSE 🪿</h1><p class="lead">You don't know the word. The category is:</p><div class="word-card small"><span>${esc(G.cat)}</span></div><p class="rule">Blend in. Give vague-but-plausible clues. If you get caught, guess the word to steal the win.</p>${G.geese > 1 ? `<p class="muted">There's another goose out there. Honk discreetly.</p>` : ""}`
            : `<h1>You're a Duck 🦆</h1><p class="lead">The secret word is:</p><div class="word-card small"><span>${esc(G.word)}</span></div><p class="rule">Category: ${esc(G.cat)}. Prove you know it — but don't make it so obvious the Goose can work it out.</p>`}
          <button class="btn btn-primary btn-xl" id="hide">Hide it & pass on</button>
        </section>`, (el) => { if (isGoose) App.sound.honk(); else App.sound.quack(); $("#hide", el).onclick = () => reveal(i + 1); });
    }, { title: "Duck Duck Goose" });
  }

  function clues() {
    const P = App.state.players, first = pick(P);
    render(`${App.topbar("Duck Duck Goose", `Category: ${esc(G.cat)}`)}
      <section class="screen center">
        ${G.minutes ? App.timerBar() : ""}
        <div class="hero-duck bob">${App.duckFor(first, { mood: "happy" })}</div>
        <h1>${esc(first.name)} goes first</h1>
        <p class="lead">Go round the circle. Everyone says <b>one word</b> linked to the secret. Two laps if you're feeling brave. Then argue.</p>
        <p class="rule">Category: <b>${esc(G.cat)}</b></p>
        <button class="btn btn-primary btn-xl" id="vote">Time to vote</button>
      </section>`, (el) => {
      let t;
      if (G.minutes) t = App.timer(G.minutes * 60, (r, f) => { App.updateTimerBar(el, r, f); const tx = $(".timertext", el); if (tx) tx.textContent = `${Math.floor(r / 60)}:${String(Math.ceil(r % 60) === 60 ? 0 : Math.ceil(r % 60)).padStart(2, "0")}`; }, () => { App.sound.honk(); });
      $("#vote", el).onclick = () => { if (t) t.stop(); vote(); };
    });
  }

  function vote() {
    const P = App.state.players;
    render(`${App.topbar("Duck Duck Goose", "The vote")}
      <section class="screen">
        <h1 class="center">Who's the Goose?</h1>
        <p class="lead center">On three, everyone point at the suspect. One… two… <b>HONK!</b><br>Then tap whoever got the most fingers.</p>
        <div class="pick-grid">${P.map((p, i) => `<button class="pick" data-i="${i}">${App.duckFor(p, { mood: "shock" })}<span>${esc(p.name)}</span></button>`).join("")}</div>
      </section>`, (el) => {
      $$(".pick", el).forEach((b) => (b.onclick = () => accused(+b.dataset.i)));
    });
  }

  function accused(i) {
    const P = App.state.players, p = P[i], caught = G.geeseIdx.includes(i);
    const geeseNames = G.geeseIdx.map((g) => P[g].name);
    if (!caught) { App.sound.bad(); return result(false, `${esc(p.name)} was a Duck! 😬`, `You cooked an innocent duck. The ${geeseNames.length > 1 ? "Geese were" : "Goose was"} <b>${geeseNames.map(esc).join(" & ")}</b>.`); }
    App.sound.honk();
    render(`${App.topbar("Duck Duck Goose", "Caught!")}
      <section class="screen center">
        <div class="hero-duck bob">${App.duck({ goose: true, mood: "shock", quack: true })}</div>
        <h1>HONK! ${esc(p.name)} is a Goose!</h1>
        <p class="lead">But wait — one last chance. ${esc(p.name)}, say what you think the secret word was. Out loud. Now.</p>
        <div class="play-btns">
          <button class="btn btn-bad btn-xl" id="right">They got it 😱</button>
          <button class="btn btn-good btn-xl" id="wrong">Wrong! 🎉</button>
        </div>
      </section>`, (el) => {
      $("#right", el).onclick = () => result(false, "The Goose stole it!", `${esc(p.name)} guessed <b>${esc(G.word)}</b>. Absolutely fowl play.`);
      $("#wrong", el).onclick = () => result(true, "Ducks win! 🦆", `The word was <b>${esc(G.word)}</b>. Goose: cooked. À l'orange, ideally.`);
    });
  }

  function result(ducksWin, title, text) {
    const P = App.state.players;
    P.forEach((p, i) => {
      scores[p.name] = scores[p.name] || 0;
      const g = G.geeseIdx.includes(i);
      if (ducksWin && !g) scores[p.name] += 1;
      if (!ducksWin && g) scores[p.name] += 2;
    });
    if (ducksWin) { App.sound.win(); App.confetti(); } else App.sound.honk();
    App.state.inGame = false;
    render(`${App.topbar("Duck Duck Goose", "Results")}
      <section class="screen center">
        <div class="hero-duck bob">${ducksWin ? App.duck({ hat: "crown", mood: "happy" }) : App.duck({ goose: true, hat: "crown", mood: "sly" })}</div>
        <h1>${title}</h1>
        <p class="lead">${text}</p>
        <p class="muted">The word was “${esc(G.word)}” (${esc(G.cat)}). Ducks score 1 for a win, Geese score 2.</p>
        ${App.scoreboard(P.map((p) => ({ name: p.name, score: scores[p.name] || 0, duck: App.duckFor(p) })))}
        <button class="btn btn-primary btn-xl" id="again">Another round</button>
        <button class="btn" data-home>Back to the pond</button>
      </section>`, (el) => ($("#again", el).onclick = () => { App.state.inGame = true; deal(); }));
  }

  App.games.goose = { start };
})();
