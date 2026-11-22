/* Quackers — a social card deck. 20 cards a game, then it's over; play again for a fresh 20. */
(function () {
  const { $, esc, render, pick, content } = App;
  const DECK_SIZE = 20;

  const TYPES = {
    likely: { label: "Who's most likely to…", how: "On three, everyone POINT. Most fingers does a little waddle of shame.", look: { body: "#FFD23F", hat: "party", mood: "sly" }, cls: "c-likely" },
    whowould: { label: "Pick a duck", how: "On three, point at your pick. Most fingers takes a bow.", look: { body: "#7FDBFF", hat: "crown", mood: "happy" }, cls: "c-whowould" },
    never: { label: "Never have I ever…", how: "QUACK if you have. Explanations are mandatory.", look: { body: "#9BE564", hat: "halo", mood: "wink" }, cls: "c-never" },
    rather: { label: "Would you rather…", how: "Left wing or right wing? Raise one. Minority defends themselves.", look: { body: "#C9A7FF", hat: "top", mood: "normal" }, cls: "c-rather" },
    hottake: { label: "Hot take 🌶️", how: "Thumbs up or down on three. The lone dissenter must argue their case.", look: { body: "#FFB347", hat: "beanie", mood: "sly" }, cls: "c-hottake" },
    fowl: { label: "Fowl Play 🎲", how: "Do it, or take a forfeit the flock agrees on.", look: { body: "#FF6B6B", hat: "horns", mood: "sly" }, cls: "c-fowl" },
  };
  App.QUACK_TYPES = TYPES;
  let G;

  /** All cards as "type|text" strings (so the no-repeat memory can track them). */
  function pool(mode) {
    const src = content.quackers, cheeky = App.state.settings.cheeky, out = [];
    Object.keys(TYPES).forEach((t) => {
      if (mode !== "all" && mode !== t) return;
      (src.clean[t] || []).forEach((x) => out.push(t + "|" + x));
      if (cheeky) (src.cheeky[t] || []).forEach((x) => out.push(t + "|" + x));
    });
    return out;
  }

  function start() { G = { mode: "all" }; deal(); card(); }
  function deal() { G.deck = App.fresh("quackers", pool(G.mode), DECK_SIZE).map((s) => { const i = s.indexOf("|"); return { t: s.slice(0, i), x: s.slice(i + 1) }; }); G.i = 0; }

  function card() {
    if (G.i >= G.deck.length) return end();
    const c = G.deck[G.i], T = TYPES[c.t];
    const P = App.state.players;
    let body;
    if (c.t === "rather") { const [a, b] = c.x.split("|"); body = `<div class="rather"><span>🫲 ${esc(a)}</span><em>or</em><span>${esc(b)} 🫱</span></div>`; }
    else if (c.t === "fowl") body = `<p class="qc-text">${esc(c.x).replace(/\{p\}/g, () => `<b>${esc(pick(P).name)}</b>`)}</p>`;
    else body = `<p class="qc-text">${esc(c.x)}${c.t === "likely" || c.t === "whowould" ? "?" : "."}</p>`;

    render(`${App.topbar("Quackers", `Card ${G.i + 1} of ${G.deck.length}`)}
      <section class="screen">
        ${G.i === 0 ? App.chooser("mode", [["all", "All"], ["likely", "Most likely"], ["whowould", "Pick a duck"], ["never", "Never have I"], ["rather", "Would you rather"], ["hottake", "Hot takes"], ["fowl", "Fowl Play"]], G.mode) : `<div class="deck-progress"><i style="width:${(G.i / G.deck.length) * 100}%"></i></div>`}
        <div class="q-card ${T.cls}" id="qc">
          <div class="qc-duck">${App.duck(T.look)}</div>
          <span class="qc-label">${T.label}</span>
          ${body}
          <span class="qc-how">${T.how}</span>
        </div>
        ${c.t === "likely" || c.t === "whowould" || c.t === "hottake" ? `<button class="btn btn-xl" id="count">3… 2… 1… ${c.t === "hottake" ? "THUMBS! 👍👎" : "POINT! 👉"}</button>` : ""}
        <button class="btn btn-primary btn-xl" id="next">${G.i + 1 < G.deck.length ? "Next card" : "Last card done!"}</button>
      </section>`, (el) => {
      App.wireChoosers(el, (k, v) => { G.mode = v; deal(); card(); });
      $("#next", el).onclick = () => { G.i++; App.sound.quack(); card(); };
      const cnt = $("#count", el);
      if (cnt) {
        const label = cnt.textContent;
        cnt.onclick = () => {
          let n = 3; cnt.disabled = true;
          const tick = () => {
            if (n === 0) { cnt.textContent = c.t === "hottake" ? "THUMBS! 👍👎" : "POINT! 👉👉👉"; App.sound.honk(); setTimeout(() => { cnt.disabled = false; cnt.textContent = label; }, 1500); return; }
            cnt.textContent = n + "…"; App.sound.tick(); n--; setTimeout(tick, 700);
          };
          tick();
        };
      }
      const qc = $("#qc", el); let x0 = null;
      qc.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
      qc.addEventListener("touchend", (e) => { if (x0 != null && Math.abs(e.changedTouches[0].clientX - x0) > 70) { G.i++; App.sound.quack(); card(); } x0 = null; });
    });
  }

  function end() {
    App.state.inGame = false;
    App.sound.win(); App.confetti();
    render(`${App.topbar("Quackers", "That's the lot!")}
      <section class="screen center">
        <div class="hero-duck bob">${App.duck({ body: "#FFD23F", hat: "crown", mood: "happy" })}</div>
        <h1>${G.deck.length} cards. No survivors.</h1>
        <p class="lead">Friendships tested. Secrets spilled. Play again for a brand new 20 — we won't repeat the ones you've just had.</p>
        <button class="btn btn-primary btn-xl" id="again">Deal a fresh 20</button>
        <button class="btn" data-home>Back to the pond</button>
      </section>`, (el) => ($("#again", el).onclick = () => { App.state.inGame = true; start(); }));
  }

  App.games.quackers = { start };
})();
