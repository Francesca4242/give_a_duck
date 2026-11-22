/* Quackers — a social card deck: most likely to, never have I ever, would you rather, Fowl Play dares. */
(function () {
  const { $, $$, esc, render, shuffle, pick, content } = App;

  const TYPES = {
    likely: { label: "Who's most likely to…", how: "On three, everyone POINT. Most fingers does a little waddle of shame.", look: { body: "#FFD23F", hat: "party", mood: "sly" }, cls: "c-likely" },
    never: { label: "Never have I ever…", how: "QUACK if you have. Explanations are mandatory.", look: { body: "#9BE564", hat: "halo", mood: "wink" }, cls: "c-never" },
    rather: { label: "Would you rather…", how: "Left wing or right wing? Raise one. Minority defends themselves.", look: { body: "#C9A7FF", hat: "top", mood: "normal" }, cls: "c-rather" },
    fowl: { label: "Fowl Play 🎲", how: "Do it, or take a forfeit the flock agrees on.", look: { body: "#FF6B6B", hat: "horns", mood: "sly" }, cls: "c-fowl" },
  };
  let G;

  function start() {
    G = { mode: "all" };
    build();
    card();
  }

  function build() {
    const cheeky = App.state.settings.cheeky, src = content.quackers;
    const deck = [];
    Object.keys(TYPES).forEach((t) => {
      if (G.mode !== "all" && G.mode !== t) return;
      src.clean[t].forEach((x) => deck.push({ t, x }));
      if (cheeky) src.cheeky[t].forEach((x) => deck.push({ t, x }));
    });
    G.deck = shuffle(deck); G.i = 0;
  }

  function card() {
    if (G.i >= G.deck.length) { G.deck = shuffle(G.deck); G.i = 0; }
    const c = G.deck[G.i], T = TYPES[c.t];
    const P = App.state.players;
    let body;
    if (c.t === "rather") { const [a, b] = c.x.split("|"); body = `<div class="rather"><span>🫲 ${esc(a)}</span><em>or</em><span>${esc(b)} 🫱</span></div>`; }
    else if (c.t === "fowl") body = `<p class="qc-text">${esc(c.x).replace(/\{p\}/g, () => `<b>${esc(pick(P).name)}</b>`)}</p>`;
    else body = `<p class="qc-text">${esc(c.x)}${c.t === "likely" ? "?" : "."}</p>`;

    render(`${App.topbar("Quackers", `Card ${G.i + 1}`)}
      <section class="screen">
        ${App.chooser("mode", [["all", "All"], ["likely", "Most likely"], ["never", "Never have I"], ["rather", "Would you rather"], ["fowl", "Fowl Play"]], G.mode)}
        <div class="q-card ${T.cls}" id="qc">
          <div class="qc-duck">${App.duck(T.look)}</div>
          <span class="qc-label">${T.label}</span>
          ${body}
          <span class="qc-how">${T.how}</span>
        </div>
        ${c.t === "likely" ? `<button class="btn btn-xl" id="count">3… 2… 1… POINT! 👉</button>` : ""}
        <button class="btn btn-primary btn-xl" id="next">Next card</button>
      </section>`, (el) => {
      App.wireChoosers(el, (k, v) => { G.mode = v; build(); card(); });
      $("#next", el).onclick = () => { G.i++; App.sound.quack(); card(); };
      const cnt = $("#count", el);
      if (cnt) cnt.onclick = () => {
        let n = 3; cnt.disabled = true;
        const tick = () => {
          if (n === 0) { cnt.textContent = "POINT! 👉👉👉"; App.sound.honk(); setTimeout(() => { cnt.disabled = false; cnt.textContent = "3… 2… 1… POINT! 👉"; }, 1500); return; }
          cnt.textContent = n + "…"; App.sound.tick(); n--; setTimeout(tick, 700);
        };
        tick();
      };
      // swipe left to advance
      const qc = $("#qc", el); let x0 = null;
      qc.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
      qc.addEventListener("touchend", (e) => { if (x0 != null && Math.abs(e.changedTouches[0].clientX - x0) > 70) { G.i++; App.sound.quack(); card(); } x0 = null; });
    });
  }

  App.games.quackers = { start };
})();
