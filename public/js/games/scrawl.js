/* Scrawl-ack — drawing telephone. Write → draw → guess → draw → … → reveal. */
(function () {
  const { $, $$, esc, render, shuffle, pick, content } = App;
  let G;

  function start() {
    G = { laps: 1, seconds: 60, startMode: "random" };
    setup();
  }

  function setup() {
    const n = App.state.players.length;
    render(`${App.topbar("Scrawl-ack", "Setup")}
      <section class="screen">
        <div class="center"><div class="hero-duck small bob">${App.duck({ body: "#7FDBFF", hat: "beanie", mood: "wink" })}</div></div>
        <p class="lead">One phone passes down the line. Each duck only sees the step before theirs: a phrase to draw, or a drawing to describe. Then we reveal the whole horrible journey.</p>
        <div class="field"><label>How does it start?</label>${App.chooser("startMode", [["random", "🎲 Random prompt"], ["write", "✍️ First duck writes one"]], G.startMode)}</div>
        <div class="field"><label>Drawing time</label>${App.chooser("seconds", [[45, "45s"], [60, "60s"], [90, "90s"], [0, "No limit"]], G.seconds)}</div>
        <div class="field"><label>Laps of the flock</label>${App.chooser("laps", [[1, `Once (${n} steps)`], [2, `Twice (${n * 2} steps)`]], G.laps)}</div>
        <button class="btn btn-primary btn-xl" id="go">Sharpen the crayons</button>
      </section>`, (el) => {
      App.wireChoosers(el, (k, v) => { G[k] = k === "startMode" ? v : +v; });
      $("#go", el).onclick = begin;
    });
  }

  function begin() {
    G.order = shuffle(App.state.players.map((_, i) => i));
    G.total = G.order.length * G.laps;
    G.chain = [];
    if (G.startMode === "random") {
      G.chain.push({ type: "text", by: null, content: pick(content.pool(content.scrawl)) });
    }
    next();
  }

  function playerAt(step) { return App.state.players[G.order[step % G.order.length]]; }

  function next() {
    const step = G.chain.length - (G.startMode === "random" ? 1 : 0);
    if (step >= G.total) { reveal(); return; }
    const p = playerAt(step), prev = G.chain[G.chain.length - 1];
    const sub = `Step ${step + 1} of ${G.total}`;
    if (!prev) App.handoff(p, "You're starting the chain. Write something deliciously drawable.", () => write(p, null, sub), { title: "Scrawl-ack", sub });
    else if (prev.type === "text") App.handoff(p, "You're drawing. No letters or numbers — that's cheating, you absolute goose.", () => draw(p, prev.content, sub), { title: "Scrawl-ack", sub });
    else App.handoff(p, "You're guessing what on earth the last duck drew.", () => write(p, prev.content, sub), { title: "Scrawl-ack", sub });
  }

  function write(p, img, sub) {
    render(`${App.topbar("Scrawl-ack", sub)}
      <section class="screen">
        ${img ? `<p class="lead">What is this masterpiece?</p><img class="scrawl-img" src="${img}" alt="the previous drawing">` : `<p class="lead">Write a phrase for the next duck to draw.</p>`}
        <form id="f" class="word-row">
          <input id="t" maxlength="80" autocomplete="off" placeholder="${img ? "I think it's…" : "e.g. a duck at a job interview"}">
          ${img ? "" : `<button type="button" class="icon-btn" id="dice" aria-label="Random prompt">🎲</button>`}
        </form>
        <button class="btn btn-primary btn-xl" id="send">Lock it in</button>
      </section>`, (el) => {
      const t = $("#t", el);
      const d = $("#dice", el); if (d) d.onclick = () => { t.value = pick(content.pool(content.scrawl)); App.sound.pop(); };
      const send = (e) => {
        if (e) e.preventDefault();
        const v = t.value.trim();
        if (!v) { t.focus(); t.placeholder = img ? "Go on, have a guess!" : "Write something, or hit the dice!"; return; }
        G.chain.push({ type: "text", by: p.name, content: v });
        App.sound.quack();
        next();
      };
      $("#f", el).onsubmit = send;
      $("#send", el).onclick = send;
    });
  }

  function draw(p, prompt, sub) {
    render(`${App.topbar("Scrawl-ack", sub)}
      <section class="screen draw-screen">
        ${G.seconds ? App.timerBar() : ""}
        <p class="draw-prompt">Draw: <b>${esc(prompt)}</b></p>
        <div class="canvas-wrap"><canvas id="cv"></canvas></div>
        <div class="tools">
          <div class="swatches">${["#3b2618", "#E63946", "#FF8A1E", "#FFD23F", "#2BB673", "#3A86FF", "#C77DFF", "#FF8FAB", "#ffffff"].map((c, i) => `<button class="sw ${i === 0 ? "on" : ""}" data-c="${c}" style="background:${c}" aria-label="colour ${c}"></button>`).join("")}</div>
          <div class="sizes">${[4, 10, 22].map((s, i) => `<button class="sz ${i === 1 ? "on" : ""}" data-s="${s}" aria-label="brush ${s}"><i style="width:${s}px;height:${s}px"></i></button>`).join("")}
            <button class="icon-btn" id="undo" aria-label="Undo">↶</button><button class="icon-btn" id="clear" aria-label="Clear">🗑</button></div>
        </div>
        <button class="btn btn-primary btn-xl" id="done">Done drawing</button>
      </section>`, (el) => {
      const pad = Pad($("#cv", el));
      $$(".sw", el).forEach((b) => (b.onclick = () => { $$(".sw", el).forEach((x) => x.classList.toggle("on", x === b)); pad.color = b.dataset.c; }));
      $$(".sz", el).forEach((b) => (b.onclick = () => { $$(".sz", el).forEach((x) => x.classList.toggle("on", x === b)); pad.size = +b.dataset.s; }));
      $("#undo", el).onclick = () => pad.undo();
      $("#clear", el).onclick = () => pad.clear();
      let timer;
      const done = () => {
        if (timer) timer.stop();
        G.chain.push({ type: "draw", by: p.name, content: pad.image() });
        App.sound.quack();
        next();
      };
      $("#done", el).onclick = done;
      if (G.seconds) timer = App.timer(G.seconds, (r, f) => App.updateTimerBar(el, r, f), () => { App.sound.honk(); done(); });
    });
  }

  /** Minimal drawing pad with undo. Strokes are stored in canvas-space 0..1. */
  function Pad(canvas) {
    const ctx = canvas.getContext("2d");
    const strokes = [];
    let cur = null;
    const pad = { color: "#3b2618", size: 10 };
    function fit() {
      const w = canvas.parentElement.clientWidth, dpr = window.devicePixelRatio || 1;
      canvas.style.width = w + "px"; canvas.style.height = w * 0.8 + "px";
      canvas.width = w * dpr; canvas.height = w * 0.8 * dpr;
      redraw();
    }
    function paint(s) {
      const W = canvas.width, sc = W / 400;
      ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineWidth = s.s * sc; ctx.lineCap = "round"; ctx.lineJoin = "round";
      const pts = s.p;
      if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0][0] * W, pts[0][1] * W, (s.s * sc) / 2, 0, 7); ctx.fill(); return; }
      ctx.beginPath(); ctx.moveTo(pts[0][0] * W, pts[0][1] * W);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0] * W, pts[i][1] * W, mx * W, my * W);
      }
      const l = pts[pts.length - 1]; ctx.lineTo(l[0] * W, l[1] * W); ctx.stroke();
    }
    function redraw() {
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      strokes.forEach(paint); if (cur) paint(cur);
    }
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, ((e.clientY - r.top) / r.width)]; };
    canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); cur = { c: pad.color, s: pad.size, p: [pos(e)] }; redraw(); });
    canvas.addEventListener("pointermove", (e) => { if (!cur) return; e.preventDefault(); cur.p.push(pos(e)); redraw(); });
    const up = () => { if (cur) { strokes.push(cur); cur = null; } };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    window.addEventListener("resize", fit);
    pad.undo = () => { strokes.pop(); redraw(); };
    pad.clear = () => { if (!strokes.length || confirm("Bin the whole drawing?")) { strokes.length = 0; redraw(); } };
    pad.image = () => { window.removeEventListener("resize", fit); return canvas.toDataURL("image/jpeg", 0.8); };
    fit();
    return pad;
  }

  function reveal() {
    App.state.inGame = false;
    let shown = 0;
    const item = (c, i) => c.type === "draw"
      ? `<div class="chain-item"><span class="ci-by">${esc(c.by)} drew:</span><img class="scrawl-img" src="${c.content}" alt="drawing by ${esc(c.by)}"></div>`
      : `<div class="chain-item text"><span class="ci-by">${c.by ? `${esc(c.by)} ${i === 0 ? "wrote" : "guessed"}:` : "The Duck Gods decreed:"}</span><p>“${esc(c.content)}”</p></div>`;
    const draw = () => render(`${App.topbar("Scrawl-ack", "The Big Reveal")}
      <section class="screen">
        <div class="center"><div class="hero-duck small bob">${App.duck({ body: "#7FDBFF", hat: "beanie", mood: shown >= G.chain.length ? "shock" : "sly" })}</div></div>
        <div class="chain">${G.chain.slice(0, shown).map(item).join("")}</div>
        ${shown < G.chain.length
          ? `<button class="btn btn-primary btn-xl" id="more">${shown === 0 ? "Reveal the start" : "And then…"}</button>`
          : `<h2 class="center">From “${esc(G.chain[0].content)}”<br>to “${esc(G.chain[G.chain.length - 1].type === "text" ? G.chain[G.chain.length - 1].content : "…that drawing")}”.<br>Ducking incredible.</h2>
             <button class="btn btn-primary btn-xl" id="again">Play again</button><button class="btn" data-home>Back to the pond</button>`}
      </section>`, (el) => {
      const m = $("#more", el);
      if (m) m.onclick = () => { shown++; App.sound.quack(0.9 + shown * 0.03); if (shown === G.chain.length) { App.confetti(); App.sound.win(); } draw(); const items = $$(".chain-item"); items.length && items[items.length - 1].scrollIntoView({ behavior: "smooth", block: "center" }); };
      const a = $("#again", el); if (a) a.onclick = () => { App.state.inGame = true; start(); };
    });
    draw();
  }

  App.games.scrawl = { start };
})();
