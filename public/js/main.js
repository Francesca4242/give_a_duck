/* Home screen, the flock (players), settings, and game launcher. */
(function () {
  const { $, $$, esc, render, pick, content } = App;

  const GAMES = [
    { id: "hat", name: "Duck in a Hat", min: 4, tag: "Teams", blurb: "Stuff the hat with words. Describe, one-word, then quack-charades. Same words, three rounds of rising chaos.", look: { body: "#FFD23F", hat: "top", mood: "happy" } },
    { id: "scrawl", name: "Scrawl-ack", min: 3, tag: "Drawing", blurb: "Draw it, guess it, ruin it. Telephone with felt tips — the reveal is always worse than you think.", look: { body: "#7FDBFF", hat: "beanie", mood: "wink" } },
    { id: "goose", name: "Duck Duck Goose", min: 4, tag: "Secret roles", blurb: "Everyone knows the secret word… except the Goose. Sniff out the imposter before it honks its way to victory.", look: { goose: true, mood: "sly" } },
    { id: "pecking", name: "Pecking Order", min: 3, tag: "Ranking", blurb: "One duck secretly ranks five things from love to loathe. Can the flock read their tiny mind?", look: { body: "#FF9EC4", hat: "crown", mood: "sly" } },
    { id: "quackers", name: "Quackers", min: 2, tag: "Social", blurb: "Most likely to, never have I ever, would you rather and Fowl Play dares. Point, quack and shame.", look: { body: "#C8B08F", head: "#1E8A57", hat: "shades", mood: "happy" } },
  ];
  App.GAMES = GAMES;

  App.home = function () {
    App.state.inGame = false;
    const ps = App.state.players, s = App.state.settings;
    render(`<section class="screen home">
      <div class="hero">
        <div class="speech" id="quip">${esc(pick(content.quips))}</div>
        <button class="mascot bob" id="mascot" aria-label="Poke the duck">${App.duck({ hat: "party", mood: "happy" })}</button>
        <h1 class="logo"><span>I Don't Give a</span><b>DUCK</b></h1>
        <p class="tagline">Silly, slightly filthy party games for a whole flock. One phone, pass it round.</p>
      </div>

      <div class="card flock-card">
        <div class="flock-row">${ps.length ? ps.slice(0, 12).map((p) => `<span class="mini">${App.duckFor(p)}</span>`).join("") : `<span class="muted">No ducks yet. Who's playing?</span>`}${ps.length > 12 ? `<span class="more">+${ps.length - 12}</span>` : ""}</div>
        <div class="flock-meta"><strong>${ps.length} ${ps.length === 1 ? "duck" : "ducks"}</strong> in the flock</div>
        <button class="btn btn-primary" id="flock">${ps.length ? "Edit the flock" : "Gather the flock"}</button>
      </div>

      <div class="settings">
        <div class="setting"><span>Tone</span>${App.chooser("cheeky", [["false", "🧼 Clean"], ["true", "🍑 Cheeky"]], s.cheeky)}</div>
        <div class="setting"><span>Sound</span>${App.chooser("sound", [["true", "🔊 Quacks on"], ["false", "🔇 Off"]], s.sound)}</div>
      </div>

      <h2 class="section-title">Pick a game</h2>
      <div class="games">${GAMES.map((g) => `
        <button class="game-card" data-game="${g.id}">
          <span class="gc-duck">${App.duck(g.look)}</span>
          <span class="gc-body"><span class="gc-tag">${g.tag} · ${g.min}+ ducks</span><strong>${g.name}</strong><span class="gc-blurb">${g.blurb}</span></span>
        </button>`).join("")}
      </div>
      <p class="footer-note">Best with 4–20 ducks, a sofa and questionable morals. <button class="link" id="how">How does this work?</button></p>
    </section>`, (el) => {
      $("#flock", el).onclick = () => App.flock();
      $("#how", el).onclick = howTo;
      App.wireChoosers(el, (name, v) => { s[name] = v === "true"; App.save(); if (name === "sound" && s.sound) App.sound.quack(); });
      let pokes = 0;
      $("#mascot", el).onclick = () => {
        pokes++;
        const m = $("#mascot", el);
        m.innerHTML = App.duck({ hat: "party", mood: pokes % 7 === 0 ? "shock" : "happy", quack: true });
        App.sound.quack(1 + (pokes % 5) * 0.08);
        m.classList.remove("squish"); void m.offsetWidth; m.classList.add("squish");
        setTimeout(() => { m.innerHTML = App.duck({ hat: "party", mood: "happy" }); }, 220);
        $("#quip", el).textContent = pokes % 7 === 0 ? "OI. Personal space." : pick(content.quips);
      };
      $$(".game-card", el).forEach((b) => (b.onclick = () => launch(b.dataset.game)));
    });
  };

  function launch(id) {
    const g = GAMES.find((x) => x.id === id);
    if (App.state.players.length < g.min) {
      App.flock(`${g.name} needs at least ${g.min} ducks. Add a few more!`, id);
      return;
    }
    App.sound.quack();
    App.state.inGame = true;
    App.games[id].start();
  }

  App.flock = function (warning, thenGame) {
    const ps = App.state.players;
    let seed = App.store.get("seed", 1);
    const draw = () => render(`${App.topbar("The Flock", `${ps.length} ducks`)}
      <section class="screen">
        ${warning ? `<p class="warn">${esc(warning)}</p>` : ""}
        <form class="add-row" id="add">
          <input id="name" maxlength="18" placeholder="Duck's name…" autocomplete="off" enterkeyhint="done">
          <button class="btn btn-primary" type="submit">Add</button>
        </form>
        <p class="hint">Tap a duck to give it a makeover.</p>
        <ul class="players">${ps.map((p, i) => `<li>
            <button class="pl-duck" data-i="${i}" aria-label="Restyle ${esc(p.name)}">${App.duckFor(p)}</button>
            <span class="pl-name">${esc(p.name)}</span>
            <button class="icon-btn small" data-del="${i}" aria-label="Remove ${esc(p.name)}">✕</button>
          </li>`).join("")}</ul>
        ${ps.length ? "" : `<div class="empty">${App.duck({ mood: "sly", hat: "none" })}<p>An empty pond. Tragic.</p></div>`}
        <div class="actions">
          ${thenGame ? `<button class="btn btn-primary btn-xl" id="go" ${ps.length < GAMES.find((g) => g.id === thenGame).min ? "disabled" : ""}>Play ${GAMES.find((g) => g.id === thenGame).name}</button>` : ""}
          <button class="btn ${thenGame ? "" : "btn-primary btn-xl"}" id="done">Back to the pond</button>
          ${ps.length ? `<button class="btn btn-ghost" id="clear">Clear everyone</button>` : ""}
        </div>
      </section>`, (el) => {
      const input = $("#name", el);
      $("#add", el).onsubmit = (e) => {
        e.preventDefault();
        const name = input.value.trim().replace(/\s+/g, " ");
        if (!name) return;
        if (ps.some((p) => p.name.toLowerCase() === name.toLowerCase())) { input.value = ""; input.placeholder = "Already got a " + name + "!"; return; }
        ps.push({ name, look: App.duckLook(seed++) });
        App.store.set("seed", seed); App.save(); App.sound.quack();
        warning = null; draw(); $("#name").focus();
      };
      $$("[data-i]", el).forEach((b) => (b.onclick = () => { ps[b.dataset.i].look = App.duckLook(seed++); App.store.set("seed", seed); App.save(); App.sound.quack(1.2); draw(); }));
      $$("[data-del]", el).forEach((b) => (b.onclick = () => { ps.splice(+b.dataset.del, 1); App.save(); draw(); }));
      $("#done", el).onclick = () => App.home();
      const go = $("#go", el); if (go) go.onclick = () => launch(thenGame);
      const clr = $("#clear", el); if (clr) clr.onclick = () => { if (confirm("Release every duck back into the wild?")) { ps.length = 0; App.save(); draw(); } };
    });
    draw();
  };

  function howTo() {
    render(`${App.topbar("How it works")}
      <section class="screen prose">
        <div class="center">${App.duck({ hat: "top", mood: "normal" })}</div>
        <h2>One phone. Many ducks.</h2>
        <p>Add everyone to <b>the flock</b>, pick a game, then pass the phone around when it tells you to. When a screen says <i>"Pass the phone to…"</i>, everyone else looks away. Honour system. Ducks are honourable. Mostly.</p>
        <p>Switch <b>🍑 Cheeky</b> off on the home screen for a clean deck (grandma's here, or the kids, or HR).</p>
        <h3>The games</h3>
        ${GAMES.map((g) => `<p><b>${g.name}</b> — ${g.blurb}</p>`).join("")}
        <button class="btn btn-primary btn-xl" data-home>Got it, let's quack</button>
      </section>`);
  }

  document.addEventListener("DOMContentLoaded", () => App.home());
})();
