/* Shared helpers: state, rendering, timers, hand-off screens, sounds, confetti. */
(function () {
  const App = (window.App = window.App || {});
  App.games = App.games || {};

  /* ---------- tiny utils ---------- */
  App.$ = (s, r = document) => r.querySelector(s);
  App.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  App.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  App.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  App.pick = (a) => a[Math.floor(Math.random() * a.length)];
  /** n picks from pool, avoiding things this phone has seen recently. */
  App.fresh = (key, pool, n) => {
    const used = App.store.get("used:" + key, []);
    const out = App.content.fresh(pool, n, used);
    App.store.set("used:" + key, used);
    return out;
  };

  /* ---------- persistence (never required) ---------- */
  App.store = {
    get(k, d) { try { const v = localStorage.getItem("gad:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("gad:" + k, JSON.stringify(v)); } catch (e) { /* private mode etc. */ } },
  };

  App.state = {
    players: App.store.get("players", []),
    settings: Object.assign({ cheeky: true, sound: true }, App.store.get("settings", {})),
    inGame: false,
  };
  App.save = () => { App.store.set("players", App.state.players); App.store.set("settings", App.state.settings); };

  /* ---------- rendering ---------- */
  const root = () => document.getElementById("app");
  /** Replace the screen. `setup(el)` wires up handlers. */
  App.render = function (html, setup) {
    const el = root();
    el.innerHTML = html;
    el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter");
    window.scrollTo(0, 0);
    document.body.classList.toggle("is-home", !!el.querySelector(".home"));
    if (setup) setup(el);
    App.$$("[data-quack]", el).forEach((d) => d.addEventListener("click", () => App.sound.quack()));
  };

  /** Standard in-game top bar with a home button. */
  App.topbar = function (title, sub) {
    return `<header class="topbar">
      <button class="icon-btn" data-home aria-label="Back to the pond">🏠</button>
      <div class="tb-title"><strong>${title}</strong>${sub ? `<span>${sub}</span>` : ""}</div>
      <span class="tb-spacer"></span>
    </header>`;
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-home]");
    if (!b) return;
    if (App.state.inGame && !confirm("Abandon this game and waddle home?")) return;
    App.stopTimers();
    App.home();
  });

  /** "Pass the phone to X" privacy screen. */
  App.handoff = function (player, message, onReady, opts = {}) {
    App.render(`${App.topbar(opts.title || "Pass it on", opts.sub)}
      <section class="screen center handoff">
        <p class="eyebrow">Pass the phone to</p>
        <div class="handoff-duck bob">${App.duckFor(player, { mood: "sly" })}</div>
        <h1 class="big-name">${App.esc(player.name)}</h1>
        <p class="lead">${message || "Everyone else: eyes off. No peeking, you nosy mallards."}</p>
        <button class="btn btn-primary btn-xl" id="ready">I'm ${App.esc(player.name)} — show me</button>
      </section>`, (el) => {
      App.$("#ready", el).onclick = () => { App.sound.pop(); onReady(); };
    });
  };

  /* ---------- timers ---------- */
  const timers = new Set();
  App.stopTimers = () => { timers.forEach((t) => t.stop()); timers.clear(); };
  /** Countdown. Calls onTick(remaining, fraction) ~10x/sec and onEnd() once. */
  App.timer = function (seconds, onTick, onEnd) {
    let remaining = seconds * 1000, last = performance.now(), paused = false, done = false, id;
    const t = {
      stop() { done = true; clearInterval(id); timers.delete(t); },
      pause() { paused = true; },
      resume() { paused = false; last = performance.now(); },
      get paused() { return paused; },
      get remaining() { return remaining / 1000; },
    };
    let lastWhole = Math.ceil(seconds);
    id = setInterval(() => {
      const now = performance.now();
      if (!paused) remaining -= now - last;
      last = now;
      const whole = Math.ceil(remaining / 1000);
      if (whole !== lastWhole && whole <= 5 && whole > 0) App.sound.tick();
      lastWhole = whole;
      if (remaining <= 0) { remaining = 0; onTick && onTick(0, 0); t.stop(); onEnd && onEnd(); return; }
      onTick && onTick(remaining / 1000, remaining / (seconds * 1000));
    }, 100);
    timers.add(t);
    onTick && onTick(seconds, 1);
    return t;
  };
  App.timerBar = () => `<div class="timerbar"><div class="timerfill"></div><span class="timertext"></span></div>`;
  App.updateTimerBar = (el, rem, frac) => {
    const f = App.$(".timerfill", el), tx = App.$(".timertext", el);
    if (!f) return;
    f.style.width = frac * 100 + "%";
    f.classList.toggle("low", rem <= 10);
    tx.textContent = Math.ceil(rem) + "s";
  };

  /* ---------- feathers! ---------- */
  App.confetti = function (n = 36) {
    const layer = document.createElement("div");
    layer.className = "confetti";
    const bits = ["🪶", "🦆", "🍞", "✨", "🪶", "🐣"];
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.textContent = App.pick(bits);
      s.style.left = Math.random() * 100 + "vw";
      s.style.animationDelay = Math.random() * 0.8 + "s";
      s.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
      s.style.fontSize = 18 + Math.random() * 22 + "px";
      s.style.setProperty("--spin", (Math.random() * 720 - 360) + "deg");
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 5000);
  };

  /* ---------- sound (synthesised, no files) ---------- */
  let ctx;
  const ac = () => {
    if (!App.state.settings.sound) return null;
    try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; } catch (e) { return null; }
  };
  function voice(c, { type = "sawtooth", f0, f1, dur, vol = 0.25, filt = 1100, filt1 = 700, q = 3, delay = 0 }) {
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain(), bp = c.createBiquadFilter();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    bp.type = "bandpass"; bp.Q.value = q;
    bp.frequency.setValueAtTime(filt, t); bp.frequency.exponentialRampToValueAtTime(filt1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.setValueAtTime(vol, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp); bp.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  App.sound = {
    quack(p = 1) {
      const c = ac(); if (!c) return;
      p *= 0.9 + Math.random() * 0.25;
      voice(c, { f0: 520 * p, f1: 300 * p, dur: 0.2, filt: 1500 * p, filt1: 900 * p, q: 2.5, vol: 0.5 });
      voice(c, { type: "square", f0: 260 * p, f1: 150 * p, dur: 0.2, filt: 900, filt1: 600, q: 4, vol: 0.15 });
    },
    honk() {
      const c = ac(); if (!c) return;
      voice(c, { f0: 330, f1: 280, dur: 0.32, filt: 800, filt1: 650, q: 6, vol: 0.6 });
      voice(c, { type: "square", f0: 165, f1: 140, dur: 0.32, filt: 600, filt1: 500, q: 5, vol: 0.3 });
      voice(c, { f0: 340, f1: 260, dur: 0.28, filt: 820, filt1: 600, q: 6, vol: 0.55, delay: 0.38 });
    },
    pop() { const c = ac(); if (!c) return; voice(c, { type: "sine", f0: 500, f1: 900, dur: 0.08, filt: 900, filt1: 900, q: 0.5, vol: 0.3 }); },
    tick() { const c = ac(); if (!c) return; voice(c, { type: "square", f0: 1200, f1: 1100, dur: 0.05, filt: 1500, filt1: 1500, q: 1, vol: 0.12 }); },
    good() { const c = ac(); if (!c) return; [523, 659, 784].forEach((f, i) => voice(c, { type: "triangle", f0: f, f1: f, dur: 0.14, filt: f * 2, filt1: f * 2, q: 0.3, vol: 0.3, delay: i * 0.07 })); },
    win() { const c = ac(); if (!c) return; [523, 659, 784, 1046, 784, 1046].forEach((f, i) => voice(c, { type: "triangle", f0: f, f1: f, dur: 0.18, filt: f * 2, filt1: f * 2, q: 0.3, vol: 0.3, delay: i * 0.11 })); setTimeout(() => this.quack(1.2), 800); },
    bad() { const c = ac(); if (!c) return; voice(c, { type: "sawtooth", f0: 300, f1: 90, dur: 0.5, filt: 600, filt1: 200, q: 1, vol: 0.3 }); },
  };

  /* ---------- reusable bits ---------- */
  App.chooser = function (name, options, value) {
    return `<div class="chooser" data-name="${name}">${options.map((o) => {
      const [v, label] = Array.isArray(o) ? o : [o, o];
      return `<button type="button" class="chip ${String(v) === String(value) ? "on" : ""}" data-v="${v}">${label}</button>`;
    }).join("")}</div>`;
  };
  /** Wire up all .chooser elements; onChange(name, value). */
  App.wireChoosers = function (el, onChange) {
    App.$$(".chooser", el).forEach((ch) => ch.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      App.$$(".chip", ch).forEach((c) => c.classList.toggle("on", c === b));
      App.sound.pop();
      onChange(ch.dataset.name, b.dataset.v);
    }));
  };

  App.scoreboard = function (rows) {
    // rows: [{name, score, duck}] — sorted desc here
    const sorted = rows.slice().sort((a, b) => b.score - a.score);
    const top = sorted[0] ? sorted[0].score : 0;
    return `<ol class="scoreboard">${sorted.map((r, i) => `<li class="${r.score === top && top > 0 ? "leader" : ""}">
      <span class="sb-duck">${r.duck || ""}</span><span class="sb-name">${App.esc(r.name)}</span><span class="sb-score">${r.score}</span></li>`).join("")}</ol>`;
  };
})();
