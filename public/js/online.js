/* Online rooms: every duck plays on their own phone. The server (a Cloudflare Durable Object)
   owns the game; this file renders whatever state it sends and forwards taps as actions. */
(function () {
  const { $, $$, esc, shuffle, pick, content } = App;
  const O = (App.online = { ws: null, s: null, code: null, leaving: true, offset: 0, curKey: null, pick: null, retry: 0 });

  /* ================= connection ================= */
  const creds = (code) => App.store.get("room:" + code, null);
  const myName = () => App.store.get("myName", "");
  const myLook = () => App.store.get("myLook", null) || App.duckLook(Math.floor(Math.random() * 1e6));

  O.connect = function (code, name, look) {
    O.code = code.toUpperCase();
    O.leaving = false;
    O.name = name; O.look = look;
    App.state.inGame = true;
    if (O.ws) { try { O.ws.onclose = null; O.ws.close(); } catch (e) {} }
    const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/rooms/${O.code}/ws`);
    O.ws = ws;
    banner(O.s ? "Reconnecting…" : "Waddling into the room…");
    ws.onopen = () => {
      const c = creds(O.code) || {};
      ws.send(JSON.stringify({ t: "join", name: O.name, look: O.look, pid: c.pid, key: c.key }));
    };
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.t === "welcome") {
        App.store.set("room:" + O.code, { pid: m.pid, key: m.key });
        App.store.set("lastRoom", O.code);
        O.retry = 0; banner(null);
        history.replaceState(null, "", `?room=${O.code}`);
      } else if (m.t === "state") {
        O.offset = m.s.now - Date.now();
        O.s = m.s;
        render();
      } else if (m.t === "error") {
        toast(m.msg);
        if (m.fatal || !O.s) { O.leave(true); joinScreen(false, O.code); }
      } else if (m.t === "ink") {
        if (O.onInk) O.onInk(m);
      } else if (m.t === "kicked") {
        toast("You've been booted from the pond. 🥾");
        O.leave(true); App.home();
      }
    };
    ws.onclose = () => {
      if (O.leaving || O.ws !== ws) return;
      const wait = Math.min(8000, 500 * 2 ** O.retry++);
      banner("Lost the pond… reconnecting");
      setTimeout(() => { if (!O.leaving && O.ws === ws) O.connect(O.code, O.name, O.look); }, wait);
    };
  };

  O.leave = function (quiet) {
    O.leaving = true;
    if (O.ws) { try { O.ws.close(); } catch (e) {} }
    O.ws = null; O.s = null; O.curKey = null;
    App.state.inGame = false;
    banner(null);
    if (location.search) history.replaceState(null, "", location.pathname);
    if (!quiet) App.home();
  };

  O.act = function (a, extra) {
    if (!O.ws || O.ws.readyState !== 1) { toast("Not connected — hang on…"); return; }
    O.ws.send(JSON.stringify(Object.assign({ t: "act", a }, extra || {})));
  };

  setInterval(() => { if (O.ws && O.ws.readyState === 1) O.ws.send('{"t":"ping"}'); }, 25000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !O.leaving && O.code && (!O.ws || O.ws.readyState > 1)) O.connect(O.code, O.name, O.look);
  });

  // simple taps: <button data-act="name" data-arg='{"x":1}'>
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || !O.s || b.disabled) return;
    App.sound.pop();
    O.act(b.dataset.act, b.dataset.arg ? JSON.parse(b.dataset.arg) : {});
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-leave]")) return;
    if (confirm("Leave the room? You can rejoin with the same code.")) O.leave();
  });

  /* ================= little UI helpers ================= */
  function banner(text) {
    let b = $("#net-banner");
    if (!b) { b = document.createElement("div"); b.id = "net-banner"; document.body.appendChild(b); }
    b.textContent = text || ""; b.hidden = !text;
  }
  function toast(text) {
    const t = document.createElement("div");
    t.className = "toast"; t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
  const arg = (o) => esc(JSON.stringify(o));
  const P = (pid) => (O.s.players.find((p) => p.pid === pid) || { name: "A mystery duck", look: {} });
  const nm = (pid) => esc(P(pid).name);
  const duckOf = (pid, extra) => App.duck(Object.assign({}, P(pid).look, extra || {}));
  const isHost = () => O.s.me === O.s.host;
  const topbar = (title, sub) => `<header class="topbar">
      <button class="icon-btn" data-leave aria-label="Leave room">🚪</button>
      <div class="tb-title"><strong>${title}</strong>${sub ? `<span>${sub}</span>` : ""}</div>
      <span class="tb-spacer"></span><span class="room-pill">${esc(O.s ? O.s.code : O.code)}</span>
    </header>`;
  const hostBar = (extra = "") => isHost() ? `<div class="host-bar"><span>👑 Host controls</span>${extra}<button class="btn btn-small" data-act="lobby">End game</button></div>` : "";
  const endButtons = () => isHost()
    ? `<button class="btn btn-primary btn-xl" data-act="again">Play again</button><button class="btn" data-act="lobby">Back to the lobby</button>`
    : `<p class="muted center">Waiting for ${nm(O.s.host)} to pick what's next…</p>`;
  const scoreRows = (filter) => O.s.players.filter((p) => !filter || filter(p)).map((p) => ({ name: p.name + (p.pid === O.s.me ? " (you)" : ""), score: p.score, duck: App.duck(p.look) }));
  const timer = (deadline, total) => deadline ? `<div class="timerbar" data-deadline="${deadline}" data-total="${total}"><div class="timerfill"></div><span class="timertext"></span></div>` : "";
  const waitingFor = (roster, done) => {
    const left = roster.filter((p) => !done.includes(p));
    return left.length ? `<div class="waiting">${left.map((p) => `<span class="wdk ${P(p).on ? "" : "off"}">${duckOf(p, { mood: "sly" })}<em>${nm(p)}</em></span>`).join("")}</div>` : "";
  };

  // countdowns (server time aware) + one-shot "time's up" callbacks for the current screen
  let onDeadline = null;
  setInterval(() => {
    $$("[data-deadline]").forEach((el) => {
      const rem = Math.max(0, (+el.dataset.deadline - (Date.now() + O.offset)) / 1000);
      const f = $(".timerfill", el), tx = $(".timertext", el);
      f.style.width = (rem / +el.dataset.total) * 100 + "%";
      f.classList.toggle("low", rem <= 10);
      tx.textContent = Math.ceil(rem) + "s";
      if (rem <= 0 && onDeadline) { const fn = onDeadline; onDeadline = null; fn(); }
    });
  }, 200);

  /* ================= render loop ================= */
  function render() {
    const s = O.s;
    if (!s) return;
    let v;
    if (!s.game) v = lobby(s);
    else if (!s.game.roster.includes(s.me) && s.game.id !== "quackers") v = spectate(s);
    else v = R[s.game.id](s, s.game);
    const el = $("#app");
    if (v.key === O.curKey) {
      // same screen: only refresh the live bits so we don't wipe inputs or drawings
      const tpl = document.createElement("div");
      tpl.innerHTML = v.html;
      $$("[data-live]", el).forEach((node) => {
        const fresh = $(`[data-live="${node.dataset.live}"]`, tpl);
        if (fresh && fresh.innerHTML !== node.innerHTML) node.innerHTML = fresh.innerHTML;
      });
      if (v.live) v.live(el);
      return;
    }
    O.curKey = v.key;
    onDeadline = null;
    O.onInk = null;
    App.render(v.html, (root) => { v.setup && v.setup(root); v.live && v.live(root); });
    if (v.sound) v.sound(); else App.sound.pop();
  }
  O.render = render;

  function spectate(s) {
    return {
      key: "spectate:" + s.game.gid,
      html: `${topbar("Spectating")}<section class="screen center">
        <div class="hero-duck bob">${duckOf(s.me, { mood: "sly" })}</div>
        <h1>You waddled in mid-game</h1>
        <p class="lead">Sit tight — you'll be dealt in next round. Heckling is permitted.</p>
        ${hostBar()}</section>`,
    };
  }

  /* ================= lobby ================= */
  const OPTS = {
    hat: (o) => [
      ["teams", "Teams", [2, 3, 4], o.teams ?? 2],
      ["source", "Words from", [["flock", "✍️ Everyone writes"], ["deck", "🎲 Duck Deck"]], o.source ?? "flock"],
      ["perPlayer", "Words each", [2, 3, 4, 5], o.perPlayer ?? 3],
      ["seconds", "Seconds per turn", [30, 45, 60, 90], o.seconds ?? 45],
      ["rounds", "Rounds", [[3, "3 classic"], [4, "4 + 👀 Eyebrows Only"]], o.rounds ?? 4],
    ],
    quackback: () => [],
    doodle: (o) => [
      ["seconds", "Drawing time", [[60, "60s"], [80, "80s"], [100, "100s"]], o.seconds ?? 80],
      ["laps", "Turns each", [1, 2], o.laps ?? 1],
    ],
    scrawl: (o) => [
      ["seconds", "Drawing time", [[45, "45s"], [75, "75s"], [120, "2 min"], [0, "No limit"]], o.seconds ?? 75],
      ["steps", "Chain length", [[0, "Whole flock"], [4, "4 steps"], [6, "6 steps"], [8, "8 steps"]], o.steps ?? 0],
    ],
    goose: (o) => [
      ["geese", "Geese", [[1, "1 goose"], [2, "2 geese (7+ ducks)"]], o.geese ?? 1],
      ["category", "Category", [["random", "🎲 Surprise me"]].concat(Object.keys(content.pool(content.goose, O.s.cheeky)).map((c) => [c, c])), o.category ?? "random"],
    ],
    pecking: (o) => [["laps", "Turns each", [1, 2, 3], o.laps ?? 1]],
    quackers: (o) => [["mode", "Cards (20 per game)", [["all", "Mix of everything"], ["likely", "Most likely"], ["whowould", "Pick a duck"], ["never", "Never have I"], ["rather", "Would you rather"], ["hottake", "Hot takes"], ["fowl", "Fowl Play"]], o.mode ?? "all"]],
  };
  const MIN = { hat: 4, scrawl: 3, goose: 3, pecking: 3, quackers: 2, quackback: 3, doodle: 3 };

  function lobby(s) {
    const host = isHost();
    const online = s.players.filter((p) => p.on).length;
    O.pick = O.pick || { game: "goose", opts: {} };
    const g = App.GAMES.find((x) => x.id === O.pick.game);
    const link = `${location.origin}/?room=${s.code}`;
    const scored = s.players.some((p) => p.score > 0);
    return {
      key: `lobby:${host}:${O.pick.game}:${s.cheeky}`,
      html: `${topbar("The Lobby", `${online} ${online === 1 ? "duck" : "ducks"} here`)}
      <section class="screen">
        <div class="card join-card">
          <p class="eyebrow">Room code</p>
          <div class="room-code">${s.code.split("").map((c) => `<span>${c}</span>`).join("")}</div>
          <div class="qr" id="qr"></div>
          <p class="muted small-url">${esc(link.replace(/^https?:\/\//, ""))}</p>
          <div class="play-btns"><button class="btn" id="share">📤 Share link</button><button class="btn" id="copy">📋 Copy</button></div>
        </div>
        <h2 class="section-title">The flock <button class="btn btn-small" id="restyle">🎨 Restyle me</button></h2>
        <ul class="players" data-live="players">${s.players.map((p) => `<li class="${p.on ? "" : "off"}">
            <span class="pl-duck">${App.duck(p.look)}</span>
            <span class="pl-name">${esc(p.name)}${p.pid === s.host ? " 👑" : ""}${p.pid === s.me ? " <small>(you)</small>" : ""}</span>
            ${host && p.pid !== s.me ? `<button class="icon-btn small" data-act="kick" data-arg='${arg({ pid: p.pid })}' aria-label="Remove ${esc(p.name)}">✕</button>` : ""}
          </li>`).join("")}</ul>
        ${host ? `
          <div class="setting"><span>Tone</span>${App.chooser("cheeky", [["false", "🧼 Clean"], ["true", "🍑 Cheeky"]], s.cheeky)}</div>
          <h2 class="section-title">Pick a game</h2>
          <div class="game-pick">${App.GAMES.map((x) => `<button class="gp ${x.id === O.pick.game ? "on" : ""}" data-pick="${x.id}"><span class="gp-duck">${App.duck(x.look)}</span><span>${x.name}</span></button>`).join("")}</div>
          <div class="card opts">
            <strong class="opts-title">${g.name}</strong>
            <p class="muted">${g.blurb}</p>
            ${OPTS[g.id](O.pick.opts).map(([k, label, choices, val]) => `<div class="field"><label>${label}</label>${App.chooser(k, choices, val)}</div>`).join("")}
          </div>
          <div data-live="start">${online < MIN[g.id] ? `<p class="warn">${g.name} needs ${MIN[g.id]}+ ducks in the room.</p>` : ""}
          <button class="btn btn-primary btn-xl" id="start" ${online < MIN[g.id] ? "disabled" : ""}>Start ${g.name}</button></div>`
        : `<div class="card center waiting-card"><div class="hero-duck small bob">${duckOf(s.host, { mood: "happy" })}</div>
            <p class="lead">Waiting for <b>${nm(s.host)}</b> to pick a game…</p>
            <p class="muted">Tone: ${s.cheeky ? "🍑 Cheeky" : "🧼 Clean"}</p></div>`}
        ${scored ? `<h2 class="section-title">Leaderboard ${host ? `<button class="btn btn-small" data-act="resetScores">Reset</button>` : ""}</h2><div data-live="scores">${App.scoreboard(scoreRows())}</div>` : ""}
      </section>`,
      setup(el) {
        const q = $("#qr", el);
        if (window.qrcode) { const qr = qrcode(0, "M"); qr.addData(link); qr.make(); q.innerHTML = qr.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); }
        $("#copy", el).onclick = () => { navigator.clipboard && navigator.clipboard.writeText(link).then(() => toast("Link copied! 🦆"), () => toast(link)); };
        $("#share", el).onclick = () => {
          if (navigator.share) navigator.share({ title: "I Don't Give a Duck", text: `Join my room (${s.code}) on I Don't Give a Duck 🦆`, url: link }).catch(() => {});
          else $("#copy", el).click();
        };
        $("#restyle", el).onclick = () => {
          const look = App.duckLook(Math.floor(Math.random() * 1e6));
          App.store.set("myLook", look); O.look = look;
          O.act("look", { look }); App.sound.quack(1.2);
        };
        if (!host) return;
        App.wireChoosers(el, (k, v) => {
          if (k === "cheeky") { O.act("cheeky", { v: v === "true" }); return; }
          O.pick.opts[k] = isNaN(+v) ? v : +v;
        });
        $$("[data-pick]", el).forEach((b) => (b.onclick = () => { O.pick = { game: b.dataset.pick, opts: {} }; App.sound.quack(); render(); }));
      },
      live(el) {
        const st = $("#start", el);
        if (st) st.onclick = () => { App.sound.quack(); O.act("start", { game: O.pick.game, opts: O.pick.opts }); };
      },
    };
  }

  /* ================= games ================= */
  const R = {};

  /* ----- Duck Duck Goose ----- */
  R.goose = (s, g) => {
    const me = s.me, roleCard = g.role === "goose"
      ? `<div class="role-card is-goose"><div class="hero-duck small">${App.duck({ goose: true, mood: "sly", hat: P(me).look.hat })}</div><h2>You're the GOOSE 🪿</h2><p>Category: <b>${esc(g.cat)}</b></p><p class="muted">Blend in. If they catch you, guess the word to steal the win.${g.geeseCount > 1 ? " There's another goose out there…" : ""}</p></div>`
      : `<div class="role-card is-duck"><div class="hero-duck small">${duckOf(me, { mood: "happy" })}</div><h2>You're a Duck 🦆</h2><p class="secret-word">${esc(g.word || "")}</p><p class="muted">Category: ${esc(g.cat)}. Prove you know it without giving it away.</p></div>`;
    const sub = `Category: ${esc(g.cat)}`;
    if (g.phase === "clues") return {
      key: `g:${g.gid}:clues`,
      sound: () => (g.role === "goose" ? App.sound.honk() : App.sound.quack()),
      html: `${topbar("Duck Duck Goose", sub)}<section class="screen">
        <button class="role-wrap" id="hide" aria-label="Hide or show your role">${roleCard}<span class="role-cover">🙈 Hidden — tap to peek</span></button>
        <p class="hint center">Tap the card to hide it from nosy neighbours.</p>
        <div class="card center"><p class="lead"><b>${nm(g.first)}</b> goes first. Round the circle, one word each, linked to the secret. Then argue.</p></div>
        <button class="btn btn-primary btn-xl" data-act="toVote">Everyone's said a word → Vote!</button>
        ${hostBar()}</section>`,
      setup(el) { $("#hide", el).onclick = () => $("#hide", el).classList.toggle("covered"); },
    };
    if (g.phase === "vote") {
      const voted = !!g.myVote;
      return {
        key: `g:${g.gid}:vote:${voted}`,
        html: `${topbar("Duck Duck Goose", "The vote")}<section class="screen">
          ${voted ? `<div class="center"><div class="hero-duck small">${duckOf(g.myVote, { mood: "shock" })}</div><h2>You voted for ${nm(g.myVote)}</h2><p class="muted">Waiting for:</p></div>`
            : `<h1 class="center">Who's the Goose?</h1><p class="lead center">Tap your suspect. Votes are secret until the end.</p>
              <div class="pick-grid">${g.roster.filter((p) => p !== me).map((p) => `<button class="pick" data-act="vote" data-arg='${arg({ target: p })}'>${duckOf(p, { mood: "shock" })}<span>${nm(p)}</span></button>`).join("")}</div>`}
          <div data-live="wait">${waitingFor(g.roster.filter((p) => P(p).on), g.voted)}</div>
          ${hostBar(`<button class="btn btn-small" data-act="forceVote">Count votes now</button>`)}</section>`,
      };
    }
    if (g.phase === "guess") {
      const mine = me === g.accused;
      return {
        key: `g:${g.gid}:guess`,
        sound: () => App.sound.honk(),
        html: `${topbar("Duck Duck Goose", "Caught?!")}<section class="screen center">
          <div class="hero-duck bob">${App.duck({ goose: true, mood: "shock", quack: true })}</div>
          <h1>HONK! ${nm(g.accused)} is a Goose!</h1>
          ${mine ? `<p class="lead">Last chance. Which was the secret word?</p><div class="choice-grid">${(g.choices || []).map((w) => `<button class="btn" data-act="guess" data-arg='${arg({ word: w })}'>${esc(w)}</button>`).join("")}</div>`
            : `<p class="lead">…but if they guess the secret word, the Geese steal it. ${nm(g.accused)} is choosing…</p>`}
          ${hostBar()}</section>`,
      };
    }
    // result
    const ducksWin = g.outcome === "caught";
    const msg = {
      caught: [`Ducks win! 🦆`, `${nm(g.accused)} guessed “${esc(g.guess)}”. Wrong! Goose: cooked. À l'orange, ideally.`],
      stolen: [`The Goose stole it! 🪿`, `${nm(g.accused)} guessed <b>${esc(g.word)}</b>. Absolutely fowl play.`],
      innocent: [`${nm(g.accused)} was a Duck! 😬`, `You cooked an innocent duck. Geese win.`],
      tie: [`A tie! Nobody's cooked.`, `The flock couldn't agree, so the Geese waddle off victorious.`],
    }[g.outcome];
    const tally = Object.entries(g.tally || {}).sort((a, b) => b[1] - a[1]);
    return {
      key: `g:${g.gid}:result`,
      sound: () => { if (ducksWin) { App.sound.win(); App.confetti(); } else App.sound.honk(); },
      html: `${topbar("Duck Duck Goose", "Results")}<section class="screen center">
        <div class="hero-duck bob">${ducksWin ? App.duck({ hat: "crown", mood: "happy" }) : App.duck({ goose: true, hat: "crown", mood: "sly" })}</div>
        <h1>${msg[0]}</h1><p class="lead">${msg[1]}</p>
        <div class="card"><p>The word was <b>${esc(g.word)}</b> (${esc(g.cat)}).<br>${g.geese.length > 1 ? "Geese" : "Goose"}: <b>${g.geese.map(nm).join(" & ")}</b></p>
        ${tally.length ? `<p class="muted">Votes: ${tally.map(([p, n]) => `${nm(p)} ×${n}`).join(", ")}</p>` : ""}</div>
        <p class="muted">Ducks score 1 for a win, Geese score 2.</p>
        ${App.scoreboard(scoreRows((p) => g.roster.includes(p.pid)))}
        ${endButtons()}</section>`,
    };
  };

  /* ----- Quackers ----- */
  const QT = {
    likely: { label: "Who's most likely to…", look: { body: "#FFD23F", hat: "party", mood: "sly" }, cls: "c-likely" },
    whowould: { label: "Pick a duck", look: { body: "#7FDBFF", hat: "crown", mood: "happy" }, cls: "c-whowould" },
    never: { label: "Never have I ever…", look: { body: "#9BE564", hat: "halo", mood: "wink" }, cls: "c-never" },
    rather: { label: "Would you rather…", look: { body: "#C9A7FF", hat: "top", mood: "normal" }, cls: "c-rather" },
    hottake: { label: "Hot take 🌶️", look: { body: "#FFB347", hat: "beanie", mood: "sly" }, cls: "c-hottake" },
    fowl: { label: "Fowl Play 🎲", look: { body: "#FF6B6B", hat: "horns", mood: "sly" }, cls: "c-fowl" },
  };
  R.quackers = (s, g) => {
    if (g.phase === "final") return {
      key: `q:${g.gid}:final`,
      sound: () => { App.sound.win(); App.confetti(); },
      html: `${topbar("Quackers", "The Quackies 🏆")}<section class="screen center">
        <div class="hero-duck bob">${App.duck({ hat: "crown", mood: "happy" })}</div>
        <h1>${g.total} cards. No survivors.</h1>
        <p class="lead">And the Quackies go to…</p>
        <div class="awards">${g.awards.length ? g.awards.map((a) => `<div class="award"><div class="award-ducks">${a.pids.map((p) => `<span>${duckOf(p, { hat: "crown", mood: "happy" })}</span>`).join("")}</div>
          <strong>${a.title}</strong><b>${a.pids.map(nm).join(" & ")}</b><span class="muted">${a.sub} · ${a.n}</span></div>`).join("") : `<p class="muted">Nobody voted on anything. Suspicious.</p>`}</div>
        <p class="muted">Each winner gets a point on the lobby leaderboard. Play again for a brand new 20 — no repeats.</p>
        ${endButtons()}</section>`,
    };
    const c = g.card, T = QT[c.t], voted = g.myVote !== null;
    const roster = g.roster || s.players.map((p) => p.pid);
    const body = c.t === "rather" ? `<div class="rather"><span>🫲 ${esc(c.a)}</span><em>or</em><span>${esc(c.b)} 🫱</span></div>`
      : `<p class="qc-text">${esc(c.text)}${c.t === "likely" || c.t === "whowould" ? "?" : c.t === "fowl" ? "" : "."}</p>`;
    const pickGrid = `<div class="pick-grid">${roster.map((p) => `<button class="pick" data-act="vote" data-arg='${arg({ v: p })}'>${duckOf(p)}<span>${nm(p)}</span></button>`).join("")}</div>`;
    const two = (a, b, la, lb, ca = "", cb = "") => `<div class="play-btns"><button class="btn btn-xl ${ca}" data-act="vote" data-arg='${arg({ v: a })}'>${la}</button><button class="btn btn-xl ${cb}" data-act="vote" data-arg='${arg({ v: b })}'>${lb}</button></div>`;
    const bars = (rows) => { const tot = Math.max(1, rows.reduce((n, r) => n + r[1].length, 0)); return `<div class="results">${rows.map(([label, ps]) => `<div class="bar-row"><div class="bar-label"><b>${label}</b><span>${Math.round((ps.length / tot) * 100)}%</span></div><div class="bar"><i style="width:${(ps.length / tot) * 100}%"></i></div><div class="bar-names">${ps.map(nm).join(", ") || "nobody"}</div></div>`).join("")}</div>`; };
    let controls = "";
    if (!g.revealed && c.t !== "fowl") {
      if (voted) controls = `<p class="center lead">Locked in! Waiting for the stragglers…</p><div data-live="wait">${waitingFor(roster.filter((p) => P(p).on), g.voted)}</div><button class="btn" data-act="reveal">Reveal now</button>`;
      else if (c.t === "likely" || c.t === "whowould") controls = `<p class="center"><b>Tap your pick:</b></p>${pickGrid}`;
      else if (c.t === "rather") controls = two("a", "b", `🫲 ${esc(c.a)}`, `${esc(c.b)} 🫱`);
      else if (c.t === "hottake") controls = two("agree", "disagree", "👍 Agree", "👎 Disagree", "btn-good", "btn-bad");
      else controls = two("yes", "no", "🦆 I have", "😇 Never", "btn-good");
    } else if (g.revealed && g.votes) {
      const votes = g.votes, by = (v) => Object.keys(votes).filter((p) => votes[p] === v);
      if (c.t === "likely" || c.t === "whowould") {
        const counts = {}; Object.values(votes).forEach((p) => (counts[p] = (counts[p] || 0) + 1));
        const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        controls = `<div class="results">${rows.map(([p, n], i) => `<div class="res-row ${i === 0 ? "top" : ""}"><span class="res-duck">${duckOf(p, { mood: i === 0 ? (c.t === "likely" ? "shock" : "happy") : "normal" })}</span><b>${nm(p)}</b><span class="res-n">${n} ${n === 1 ? "vote" : "votes"}</span></div>`).join("")}</div>
          ${rows[0] ? `<p class="center lead">${c.t === "likely" ? `${nm(rows[0][0])}: waddle of shame, please. 🦆` : `${nm(rows[0][0])}: take a bow. 🙇`}</p>` : ""}`;
      } else if (c.t === "rather") controls = bars([[esc(c.a), by("a")], [esc(c.b), by("b")]]) + `<p class="center muted">Minority: defend yourselves.</p>`;
      else if (c.t === "hottake") controls = bars([["👍 Agree", by("agree")], ["👎 Disagree", by("disagree")]]) + `<p class="center muted">Smallest side argues their case. Go.</p>`;
      else if (c.t === "never") {
        const Y = by("yes");
        controls = `<div class="results center">${Y.length ? `<p class="lead">Guilty ducks 🦆</p><div class="waiting">${Y.map((p) => `<span class="wdk">${duckOf(p, { mood: "wink" })}<em>${nm(p)}</em></span>`).join("")}</div><p class="muted">Explanations are mandatory.</p>` : `<p class="lead">Nobody! What a pure, boring flock. 😇</p>`}</div>`;
      }
    }
    const last = c.n >= c.of;
    return {
      key: `q:${g.gid}:${c.n}:${voted}:${g.revealed}`,
      sound: () => App.sound.quack(),
      html: `${topbar("Quackers", `Card ${c.n} of ${c.of}`)}<section class="screen">
        <div class="deck-progress"><i style="width:${((c.n - 1) / c.of) * 100}%"></i></div>
        <div class="q-card ${T.cls}"><div class="qc-duck">${App.duck(T.look)}</div><span class="qc-label">${T.label}</span>${body}
          ${c.t === "fowl" ? `<span class="qc-how">Do it, or take a forfeit the flock agrees on.</span>` : ""}</div>
        ${controls}
        ${g.revealed ? `<button class="btn btn-primary btn-xl" data-act="next">${last ? "To the awards! 🏆" : "Next card"}</button>` : `<button class="btn btn-ghost" data-act="next">Skip card</button>`}
        ${hostBar()}</section>`,
    };
  };

  /* ----- Quack Back ----- */
  R.quackback = (s, g) => {
    const me = s.me, roundName = g.round === 2 ? "The Last Quack" : `Round ${g.round + 1}`;
    const sub = `${roundName}${g.round < 2 ? ` · ${g.round + 1}× points` : " · 3× points"}`;
    const scoreRowsQB = () => App.scoreboard(g.roster.map((p) => ({ name: P(p).name + (p === me ? " (you)" : ""), score: g.scores[p] || 0, duck: duckOf(p) })));
    if (g.phase === "write") {
      const todo = g.prompts.filter((p) => !p.answered);
      if (!todo.length) return {
        key: `qb:${g.gid}:${g.round}:write:done`,
        html: `${topbar("Quack Back", sub)}<section class="screen center">${timer(g.deadline, 90)}
          <div class="hero-duck bob">${duckOf(me, { mood: "sly" })}</div><h1>Answers in!</h1><p class="lead">Waiting for the slow writers:</p>
          <div data-live="wait">${waitingFor(g.roster.filter((p) => P(p).on), g.done)}</div>${hostBar(`<button class="btn btn-small" data-act="forceVote">Start voting now</button>`)}</section>`,
      };
      const p = todo[0];
      return {
        key: `qb:${g.gid}:${g.round}:write:${p.idx}`,
        sound: () => App.sound.quack(),
        html: `${topbar("Quack Back", sub)}<section class="screen">${timer(g.deadline, 90)}
          ${g.round === 2 ? `<p class="eyebrow center">🎤 Everyone answers this one</p>` : `<p class="eyebrow center">Prompt ${g.prompts.length - todo.length + 1} of ${g.prompts.length}</p>`}
          <div class="q-card c-quackback"><div class="qc-duck">${App.duck({ body: "#FFB347", hat: "cap", mood: "wink" })}</div><p class="qc-text">${esc(p.prompt)}</p></div>
          <form id="f" class="word-row"><input id="t" maxlength="80" autocomplete="off" placeholder="Your funniest answer…"></form>
          <button class="btn btn-primary btn-xl" id="send">Lock it in</button>
          <button class="btn btn-ghost" id="quack">🦆 I've got nothing — just quack</button>
          <p class="hint center">${g.round === 2 ? "The whole flock votes for their favourite." : "Someone else got this prompt too. The flock picks the funnier answer."}</p>
          ${hostBar()}</section>`,
        setup(el) {
          const t = $("#t", el); t.focus();
          const send = (e, text) => { if (e) e.preventDefault(); const v = text || t.value.trim(); if (!v) { t.focus(); return; } O.act("answer", { idx: p.idx, text: v }); };
          $("#f", el).onsubmit = send; $("#send", el).onclick = send;
          $("#quack", el).onclick = () => send(null, pick(["Quack.", "QUACK.", "quack?", "Quack quack quack."]));
        },
      };
    }
    if (g.phase === "vote" || g.phase === "result") {
      const res = g.phase === "result";
      if (g.round === 2) {
        const opts = g.options, max = res ? Math.max(0, ...opts.map((o) => o.votes)) : 0;
        return {
          key: `qb:${g.gid}:last:${g.phase}:${!!g.myVote}`,
          sound: () => (res ? App.sound.win() : App.sound.quack()),
          html: `${topbar("Quack Back", "The Last Quack")}<section class="screen">${res ? "" : timer(g.deadline, 25)}
            <div class="q-card c-quackback small-card"><p class="qc-text">${esc(g.prompt)}</p></div>
            <p class="center">${res ? "<b>The results!</b>" : g.myVote ? "Vote in. Waiting…" : "<b>Vote for your favourite</b> (not your own, nice try)"}</p>
            <div class="qb-answers">${opts.map((o) => `<button class="qb-ans ${o.mine ? "mine" : ""} ${g.myVote === o.id ? "on" : ""} ${res && o.votes === max && max > 0 ? "winner" : ""}" ${res || o.mine || g.myVote ? "disabled" : ""} data-act="vote" data-arg='${arg({ pick: o.id })}'>
              <span class="qb-text">${esc(o.text)}</span>${res ? `<span class="qb-by">${duckOf(o.by)}<em>${nm(o.by)}</em><b>${o.votes} ${o.votes === 1 ? "vote" : "votes"}</b></span>` : o.mine ? `<span class="qb-by"><em>(yours)</em></span>` : ""}</button>`).join("")}</div>
            ${res ? `<button class="btn btn-primary btn-xl" data-act="next">Final scores</button>` : ""}${hostBar()}</section>`,
        };
      }
      const side = (k) => {
        const o = g[k], winner = res && o.voters.length > g[k === "a" ? "b" : "a"].voters.length;
        return `<button class="qb-ans ${o.mine ? "mine" : ""} ${g.myVote === k ? "on" : ""} ${winner ? "winner" : ""}" ${res || !g.canVote || g.myVote ? "disabled" : ""} data-act="vote" data-arg='${arg({ pick: k })}'>
          <span class="qb-text">${esc(o.text)}</span>
          ${res ? `<span class="qb-by">${duckOf(o.by, { mood: winner ? "happy" : "normal" })}<em>${nm(o.by)}</em><b>+${o.points}</b></span>
            <span class="qb-voters">${o.voters.map((p) => `<i title="${nm(p)}">${duckOf(p)}</i>`).join("")}</span>` : o.mine ? `<span class="qb-by"><em>(yours)</em></span>` : ""}
        </button>`;
      };
      const qo = res && g.quackout;
      return {
        key: `qb:${g.gid}:${g.round}:${g.n}:${g.phase}:${!!g.myVote}`,
        sound: () => (res ? (qo ? (App.sound.win(), App.confetti()) : App.sound.good()) : App.sound.quack()),
        html: `${topbar("Quack Back", `${sub} · ${g.n} of ${g.of}`)}<section class="screen">${res ? "" : timer(g.deadline, 25)}
          <div class="q-card c-quackback small-card"><p class="qc-text">${esc(g.prompt)}</p></div>
          <div class="qb-versus">${side("a")}<span class="vs">VS</span>${side("b")}</div>
          ${qo ? `<h2 class="center quackout">🦆 QUACK-OUT! 🦆</h2><p class="center muted">Every single vote. Bonus points.</p>` : ""}
          <p class="center muted">${res ? "" : !g.canVote ? "One of these is yours. Sit tight and look innocent." : g.myVote ? "Vote in!" : "Tap the funnier one."}</p>
          ${res && isHost() ? `<button class="btn btn-primary" data-act="next">Next ›</button>` : ""}
          ${hostBar()}</section>`,
      };
    }
    if (g.phase === "scores") return {
      key: `qb:${g.gid}:${g.round}:scores`,
      sound: () => App.sound.good(),
      html: `${topbar("Quack Back", `After round ${g.round + 1}`)}<section class="screen center">
        <div class="hero-duck bob">${App.duck({ body: "#FFB347", hat: "cap", mood: "happy" })}</div>
        <h1>Scores so far</h1>${scoreRowsQB()}
        <p class="lead">${g.round === 0 ? "Round 2: double points." : "Next: the Last Quack — everyone answers one prompt, triple points."}</p>
        <button class="btn btn-primary btn-xl" data-act="next">${g.round === 0 ? "Round 2" : "The Last Quack"}</button>${hostBar()}</section>`,
    };
    const best = g.roster.slice().sort((a, b) => (g.scores[b] || 0) - (g.scores[a] || 0))[0];
    return {
      key: `qb:${g.gid}:final`,
      sound: () => { App.sound.win(); App.confetti(); },
      html: `${topbar("Quack Back", "Game over")}<section class="screen center">
        <div class="hero-duck bob">${duckOf(best, { hat: "crown", mood: "happy" })}</div>
        <h1>${nm(best)} is the funniest duck!</h1><p class="lead">Allegedly.</p>${scoreRowsQB()}${endButtons()}</section>`,
    };
  };

  /* ----- Doodle Duck ----- */
  const toPad = (s) => ({ c: s.c, s: s.w, p: s.p.map(([x, y]) => [x / 1000, y / 1000]) });
  const toNet = (pts) => pts.map(([x, y]) => [Math.round(x * 1000), Math.round(y * 1000)]);
  R.doodle = (s, g) => {
    const me = s.me, drawing = me === g.drawer, sub = `Turn ${Math.min(g.turn + 1, g.total)} of ${g.total}`;
    const scoreRowsD = () => App.scoreboard(g.roster.map((p) => ({ name: P(p).name + (p === me ? " (you)" : ""), score: g.scores[p] || 0, duck: duckOf(p) })));
    if (g.phase === "choose") return drawing ? {
      key: `d:${g.gid}:${g.turn}:choose:me`,
      sound: () => App.sound.quack(1.2),
      html: `${topbar("Doodle Duck", sub)}<section class="screen center">${timer(g.deadline, 15)}
        <div class="hero-duck bob">${duckOf(me, { hat: "beanie", mood: "happy" })}</div>
        <h1>You're drawing!</h1><p class="lead">Pick one. No letters, no numbers, no shame.</p>
        <div class="stack">${g.choices.map((w) => `<button class="btn btn-xl" data-act="choose" data-arg='${arg({ word: w })}'>${esc(w)}</button>`).join("")}</div>${hostBar()}</section>`,
    } : {
      key: `d:${g.gid}:${g.turn}:choose`,
      html: `${topbar("Doodle Duck", sub)}<section class="screen center">${timer(g.deadline, 15)}
        <div class="hero-duck bob">${duckOf(g.drawer, { hat: "beanie", mood: "sly" })}</div>
        <h1>${nm(g.drawer)} is picking a word…</h1><p class="lead">Get your typing thumbs ready. Fastest correct guess scores most.</p>
        ${hostBar(`<button class="btn btn-small" data-act="skip">Skip ${nm(g.drawer)}</button>`)}</section>`,
    };
    if (g.phase === "draw" || g.phase === "reveal") {
      const reveal = g.phase === "reveal", got = g.guessed[me] !== undefined;
      const feed = `<div class="feed">${g.feed.slice(-8).map((f) => f.kind === "correct" ? `<div class="fd ok">✅ <b>${nm(f.pid)}</b> got it!</div>`
        : f.kind === "close" ? `<div class="fd close">🔥 <b>${esc(f.text)}</b> is so close!</div>` : `<div class="fd"><b>${nm(f.pid)}:</b> ${esc(f.text)}</div>`).join("")}</div>`;
      const hint = `<div class="hint-word">${reveal || drawing || got ? `<b>${esc(g.word)}</b>` : [...g.hint].map((ch) => (ch === " " ? "<i class='gap'></i>" : `<span>${ch === "_" ? "" : esc(ch)}</span>`)).join("")}</div>`;
      const tools = drawing && !reveal ? `<div class="tools"><div class="swatches">${["#3b2618", "#E63946", "#FF8A1E", "#FFD23F", "#2BB673", "#3A86FF", "#C77DFF", "#FF8FAB", "#ffffff"].map((c, i) => `<button class="sw ${i === 0 ? "on" : ""}" data-c="${c}" style="background:${c}" aria-label="colour ${c}"></button>`).join("")}</div>
        <div class="sizes">${[4, 10, 22].map((z, i) => `<button class="sz ${i === 1 ? "on" : ""}" data-s="${z}" aria-label="brush ${z}"><i style="width:${z}px;height:${z}px"></i></button>`).join("")}<button class="icon-btn" id="undo" aria-label="Undo">↶</button><button class="icon-btn" id="clear" aria-label="Clear">🗑</button></div></div>` : "";
      return {
        key: `d:${g.gid}:${g.turn}:${g.phase}:${drawing ? "me" : got ? "got" : "guess"}`,
        sound: () => (reveal ? App.sound.honk() : got ? App.sound.win() : App.sound.quack()),
        html: `${topbar("Doodle Duck", `${sub} · ${drawing ? "you're drawing" : `${nm(g.drawer)} is drawing`}`)}<section class="screen draw-screen">
          ${reveal ? "" : timer(g.deadline, g.seconds)}
          <div data-live="hint">${hint}</div>
          <div class="canvas-wrap"><canvas id="cv"></canvas></div>
          ${tools}
          ${!drawing && !got && !reveal ? `<form id="gf" class="word-row"><input id="gi" maxlength="40" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Type your guess…" enterkeyhint="send"><button class="btn btn-primary" type="submit">Guess</button></form>` : ""}
          ${got && !reveal ? `<p class="center lead">✅ You got it! +${g.guessed[me]}</p>` : ""}
          <div data-live="feed">${feed}</div>
          ${reveal ? `<h2 class="center">It was “${esc(g.word)}”!</h2><p class="center muted">${Object.keys(g.guessed).length} of ${g.roster.length - 1} got it.</p>${scoreRowsD()}
            ${drawing || isHost() ? `<button class="btn btn-primary btn-xl" data-act="next">Next drawer</button>` : `<p class="muted center">Next drawer coming up…</p>`}` : ""}
          ${hostBar(reveal ? "" : `<button class="btn btn-small" data-act="skip">End this turn</button>`)}</section>`,
        setup(el) {
          const canvas = $("#cv", el);
          if (drawing && !reveal) {
            let buf = [], flushT = null;
            const flush = () => { flushT = null; if (buf.length) { O.act("ink", { op: "more", p: toNet(buf) }); buf = []; } };
            const pad = App.Pad(canvas, {
              onStart: (st) => { flush(); O.act("ink", { op: "start", c: st.c, w: st.s, p: toNet(st.p) }); },
              onMove: (pt) => { buf.push(pt); if (!flushT) flushT = setTimeout(flush, 60); },
              onUndo: () => { flush(); O.act("ink", { op: "undo" }); },
              onClear: () => { flush(); O.act("ink", { op: "clear" }); },
            });
            pad.load((g.strokes || []).map(toPad));
            $$(".sw", el).forEach((b) => (b.onclick = () => { $$(".sw", el).forEach((x) => x.classList.toggle("on", x === b)); pad.color = b.dataset.c; }));
            $$(".sz", el).forEach((b) => (b.onclick = () => { $$(".sz", el).forEach((x) => x.classList.toggle("on", x === b)); pad.size = +b.dataset.s; }));
            $("#undo", el).onclick = () => pad.undo();
            $("#clear", el).onclick = () => pad.clear();
            O.onInk = null;
          } else {
            const view = App.Pad(canvas, {}, true);
            view.load((g.strokes || []).map(toPad));
            O.onInk = (m) => {
              if (m.op === "start") view.startStroke(toPad(m.s));
              else if (m.op === "more") view.addPoints(m.p.map(([x, y]) => [x / 1000, y / 1000]));
              else if (m.op === "undo") view.pop();
              else if (m.op === "clear") view.wipe();
            };
          }
          const gf = $("#gf", el);
          if (gf) {
            const gi = $("#gi", el);
            gf.onsubmit = (e) => { e.preventDefault(); const v = gi.value.trim(); if (!v) return; O.act("guess", { text: v }); gi.value = ""; gi.focus(); };
          }
        },
      };
    }
    const best = g.roster.slice().sort((a, b) => (g.scores[b] || 0) - (g.scores[a] || 0))[0];
    return {
      key: `d:${g.gid}:final`,
      sound: () => { App.sound.win(); App.confetti(); },
      html: `${topbar("Doodle Duck", "Game over")}<section class="screen center">
        <div class="hero-duck bob">${duckOf(best, { hat: "crown", mood: "happy" })}</div>
        <h1>${nm(best)} is the Duckasso!</h1>${scoreRowsD()}${endButtons()}</section>`,
    };
  };

  /* ----- Pecking Order ----- */
  function rankUI(items, frame, cta, onDone) {
    let order = [];
    const html = `<p class="frame top">${frame[0]}</p><div class="rank-list" id="rl"></div><p class="frame bottom">${frame[1]}</p>
      <div class="play-btns"><button class="btn" id="reset">Start over</button><button class="btn btn-primary" id="rdone" disabled>${cta}</button></div>`;
    const setup = (el) => {
      const draw = () => {
        $("#rl", el).innerHTML = items.map((it, i) => { const pos = order.indexOf(it); return `<button class="rank-item ${pos >= 0 ? "on" : ""}" data-i="${i}"><span class="badge">${pos >= 0 ? pos + 1 : ""}</span>${esc(it)}</button>`; }).join("");
        $$(".rank-item", el).forEach((b) => (b.onclick = () => { const it = items[+b.dataset.i]; const at = order.indexOf(it); if (at >= 0) order.splice(at, 1); else order.push(it); App.sound.pop(); draw(); }));
        $("#rdone", el).disabled = order.length !== items.length;
      };
      $("#reset", el).onclick = () => { order = []; draw(); };
      $("#rdone", el).onclick = () => onDone(order.slice());
      draw();
    };
    return { html, setup };
  }
  R.pecking = (s, g) => {
    const me = s.me, ranker = me === g.ranker, sub = `Turn ${Math.min(g.turn + 1, g.total)} of ${g.total}`;
    const head = (mood) => `<div class="center"><div class="hero-duck small bob">${duckOf(g.ranker, { mood })}</div></div>`;
    if (g.phase === "rank") {
      if (ranker) {
        const ui = rankUI(g.items, g.frame, "Lock it in", (order) => O.act("rank", { order }));
        return { key: `p:${g.gid}:${g.turn}:rank:me`, sound: () => App.sound.quack(), html: `${topbar("Pecking Order", sub)}<section class="screen">${head("sly")}<h2 class="center">You're Top Duck!</h2><p class="muted center">Secretly tap these in order, top first.</p>${ui.html}${hostBar()}</section>`, setup: ui.setup };
      }
      return { key: `p:${g.gid}:${g.turn}:rank`, html: `${topbar("Pecking Order", sub)}<section class="screen center">${head("sly")}<h1>${nm(g.ranker)} is ranking…</h1>
        <p class="lead">Study their face. These are the five things:</p><div class="got-list">${g.items.map((i) => `<span class="chip">${esc(i)}</span>`).join("")}</div>
        <p class="muted">${g.frame[0]} → ${g.frame[1]}</p>${hostBar(`<button class="btn btn-small" data-act="skipRanker">Skip ${nm(g.ranker)}</button>`)}</section>` };
    }
    if (g.phase === "guess") {
      const guessers = g.roster.filter((p) => p !== g.ranker && P(p).on);
      const wait = `<div data-live="wait"><p class="muted center">${g.guessed.length} of ${guessers.length} guesses in</p>${waitingFor(guessers, g.guessed)}</div>`;
      if (ranker) return { key: `p:${g.gid}:${g.turn}:guess:me`, html: `${topbar("Pecking Order", sub)}<section class="screen">${head("happy")}<h2 class="center">Locked in. Poker face!</h2>
        <p class="lead center">The flock is guessing your order.</p>${wait}<button class="btn" data-act="forceReveal">Reveal now</button>${hostBar()}</section>` };
      if (!g.myGuess) {
        const ui = rankUI(shuffle(g.items), g.frame, "Final answer", (order) => O.act("guess", { order }));
        return { key: `p:${g.gid}:${g.turn}:guess:todo`, sound: () => App.sound.quack(), html: `${topbar("Pecking Order", sub)}<section class="screen">${head("sly")}<h2 class="center">How did ${nm(g.ranker)} rank them?</h2><p class="muted center">Tap in order, top first.</p>${ui.html}${hostBar()}</section>`, setup: ui.setup };
      }
      return { key: `p:${g.gid}:${g.turn}:guess:done`, html: `${topbar("Pecking Order", sub)}<section class="screen">${head("normal")}<h2 class="center">Guess locked in</h2>${wait}${hostBar(`<button class="btn btn-small" data-act="forceReveal">Reveal now</button>`)}</section>` };
    }
    if (g.phase === "reveal") {
      const mine = g.hits && g.hits[me];
      const guessRows = Object.keys(g.guesses || {}).map((p) => ({ name: P(p).name, score: g.hits[p], duck: duckOf(p) }));
      return {
        key: `p:${g.gid}:${g.turn}:reveal`,
        sound: () => { if (!ranker && mine === 5) { App.sound.win(); App.confetti(); } else App.sound.good(); },
        html: `${topbar("Pecking Order", sub)}<section class="screen">${head("happy")}
          <h2 class="center">${nm(g.ranker)}'s real order</h2>
          <p class="frame top">${g.frame[0]}</p>
          <ol class="compare">${g.secret.map((it, i) => { const hit = g.myGuess && g.myGuess[i] === it; return `<li class="${ranker ? "" : hit ? "hit" : "miss"}"><span class="badge">${i + 1}</span><span class="c-real">${esc(it)}</span><span class="c-guess">${ranker ? "" : hit ? "✅ you nailed it" : g.myGuess ? `you said: ${esc(g.myGuess[i])}` : ""}</span></li>`; }).join("")}</ol>
          <p class="frame bottom">${g.frame[1]}</p>
          <p class="center lead">${ranker ? `The flock averaged ${mine}/5 — that's your score.` : g.myGuess ? `You got <b>${mine}/5</b>${mine === 5 ? " — PERFECT PECKING ORDER! 🏆" : ""}` : ""}</p>
          <h3 class="center">How everyone did</h3>${App.scoreboard(guessRows)}
          ${ranker || isHost() ? `<button class="btn btn-primary btn-xl" data-act="next">${g.turn + 1 >= g.total ? "Final results" : "Next Top Duck"}</button>` : `<p class="muted center">Waiting for ${nm(g.ranker)} to move on…</p>`}
          ${hostBar()}</section>`,
      };
    }
    // final
    const rows = g.roster.map((p) => ({ name: P(p).name, score: g.roundScores[p] || 0, duck: duckOf(p) }));
    const sorted = rows.slice().sort((a, b) => b.score - a.score);
    return {
      key: `p:${g.gid}:final`,
      sound: () => { App.sound.win(); App.confetti(); },
      html: `${topbar("Pecking Order", "Game over")}<section class="screen center">
        <div class="hero-duck bob">${App.duck({ hat: "crown", mood: "happy", body: "#FF9EC4" })}</div>
        <h1>${esc(sorted[0].name)} rules the roost!</h1>
        <p class="muted">Guessers score per correct spot; Top Ducks score the flock's average.</p>
        ${App.scoreboard(rows)}${endButtons()}</section>`,
    };
  };

  /* ----- Scrawl-ack ----- */
  R.scrawl = (s, g) => {
    const sub = g.phase === "play" ? `Step ${g.step + 1} of ${g.steps}` : "The Big Reveal";
    if (g.phase === "play") {
      const live = `<div data-live="wait"><p class="muted center">${g.done.length} of ${g.roster.filter((p) => P(p).on).length} ducks done</p>${waitingFor(g.roster.filter((p) => P(p).on), g.done)}</div>`;
      if (g.submitted) return { key: `s:${g.gid}:${g.step}:done`, html: `${topbar("Scrawl-ack", sub)}<section class="screen center">
        <div class="hero-duck bob">${duckOf(s.me, { mood: "happy" })}</div><h1>Nice. Now wait.</h1><p class="lead">Waiting for the slowcoaches:</p>${live}${timer(g.deadline, g.seconds)}
        ${hostBar(`<button class="btn btn-small" data-act="force">Move on now</button>`)}</section>` };
      if (g.type === "draw") return {
        key: `s:${g.gid}:${g.step}:draw`,
        sound: () => App.sound.quack(),
        html: `${topbar("Scrawl-ack", sub)}<section class="screen draw-screen">${timer(g.deadline, g.seconds)}
          <p class="draw-prompt">Draw: <b>${esc(g.prev ? g.prev.content : "")}</b></p>
          <div class="canvas-wrap"><canvas id="cv"></canvas></div>
          <div class="tools"><div class="swatches">${["#3b2618", "#E63946", "#FF8A1E", "#FFD23F", "#2BB673", "#3A86FF", "#C77DFF", "#FF8FAB", "#ffffff"].map((c, i) => `<button class="sw ${i === 0 ? "on" : ""}" data-c="${c}" style="background:${c}" aria-label="colour ${c}"></button>`).join("")}</div>
            <div class="sizes">${[4, 10, 22].map((z, i) => `<button class="sz ${i === 1 ? "on" : ""}" data-s="${z}" aria-label="brush ${z}"><i style="width:${z}px;height:${z}px"></i></button>`).join("")}<button class="icon-btn" id="undo" aria-label="Undo">↶</button><button class="icon-btn" id="clear" aria-label="Clear">🗑</button></div></div>
          <button class="btn btn-primary btn-xl" id="done">Done drawing</button>${hostBar()}</section>`,
        setup(el) {
          const pad = App.Pad($("#cv", el));
          $$(".sw", el).forEach((b) => (b.onclick = () => { $$(".sw", el).forEach((x) => x.classList.toggle("on", x === b)); pad.color = b.dataset.c; }));
          $$(".sz", el).forEach((b) => (b.onclick = () => { $$(".sz", el).forEach((x) => x.classList.toggle("on", x === b)); pad.size = +b.dataset.s; }));
          $("#undo", el).onclick = () => pad.undo();
          $("#clear", el).onclick = () => pad.clear();
          let sent = false;
          const send = () => { if (sent) return; sent = true; O.act("submit", { content: pad.image() }); App.sound.quack(); };
          $("#done", el).onclick = send;
          onDeadline = () => { App.sound.honk(); send(); };
        },
      };
      const first = g.step === 0;
      return {
        key: `s:${g.gid}:${g.step}:text`,
        sound: () => App.sound.quack(),
        html: `${topbar("Scrawl-ack", sub)}<section class="screen">
          ${first ? `<p class="lead">Write something deliciously drawable for the next duck.</p>`
            : g.prev && g.prev.content ? `<p class="lead">What on earth is this?</p><img class="scrawl-img" src="${g.prev.content}" alt="the previous drawing">`
            : `<p class="lead">The last duck drew… nothing. Make something up!</p>`}
          <form id="f" class="word-row"><input id="t" maxlength="80" autocomplete="off" placeholder="${first ? "e.g. a duck at a job interview" : "I think it's…"}">${first ? `<button type="button" class="icon-btn" id="dice" aria-label="Random prompt">🎲</button>` : ""}</form>
          <button class="btn btn-primary btn-xl" id="send">Lock it in</button>${hostBar()}</section>`,
        setup(el) {
          const t = $("#t", el);
          const d = $("#dice", el); if (d) d.onclick = () => { t.value = App.fresh("scrawl", content.pool(content.scrawl, O.s.cheeky), 1)[0]; App.sound.pop(); };
          const send = (e) => { if (e) e.preventDefault(); const v = t.value.trim(); if (!v) { t.focus(); t.placeholder = "Go on, write something!"; return; } O.act("submit", { content: v }); };
          $("#f", el).onsubmit = send; $("#send", el).onclick = send;
        },
      };
    }
    const r = g.reveal;
    const item = (c, i) => c.type === "draw"
      ? `<div class="chain-item"><span class="ci-by">${nm(c.by)} drew:</span>${c.content ? `<img class="scrawl-img" src="${c.content}" alt="drawing by ${nm(c.by)}">` : `<p class="muted">(nothing. absolutely nothing.)</p>`}</div>`
      : `<div class="chain-item text"><span class="ci-by">${nm(c.by)} ${i === 0 ? "started with" : "guessed"}:</span><p>“${esc(c.content)}”</p></div>`;
    return {
      key: `s:${g.gid}:r:${r.c}:${r.i}:${r.done}`,
      sound: () => { if (r.done) { App.sound.win(); App.confetti(); } else App.sound.quack(0.9 + r.i * 0.05); },
      html: `${topbar("Scrawl-ack", `Chain ${r.c + 1} of ${r.chains}`)}<section class="screen">
        <p class="eyebrow center">${nm(r.starter)}'s chain</p>
        <div class="chain">${r.items.map(item).join("")}</div>
        ${r.done ? `<h2 class="center">That's every chain. Ducking incredible.</h2>${endButtons()}`
          : isHost() ? `<div class="play-btns"><button class="btn" data-act="rprev">← Back</button><button class="btn btn-primary" data-act="rnext">${r.i < r.len - 1 ? "And then…" : r.c < r.chains - 1 ? "Next chain" : "Finish"}</button></div>`
          : `<p class="muted center">${nm(s.host)} is flipping through the chains…</p>`}
        ${r.done ? "" : hostBar()}</section>`,
      setup() { const items = $$(".chain-item"); if (items.length > 1) items[items.length - 1].scrollIntoView({ behavior: "smooth", block: "center" }); },
    };
  };

  /* ----- Duck in a Hat ----- */
  const RULES = [
    "Say anything you like — except the word itself (or bits of it).",
    "Exactly ONE word per clue. Choose wisely.",
    "Act it out. The ONLY sound you can make is QUACK.",
    "No words. No sounds. No hands. Just your face — eyebrows doing the heavy lifting.",
  ];
  const ROUND_LOOKS = [{ hat: "top", mood: "happy" }, { hat: "shades", mood: "sly", body: "#7FDBFF" }, { hat: "party", mood: "happy", quack: true, body: "#FF9EC4" }, { mood: "normal", brows: true, body: "#9BE564" }];
  R.hat = (s, g) => {
    const me = s.me, sub = g.phase === "words" ? "Filling the hat" : `Round ${g.round + 1}: ${g.roundName}`;
    const teamsHTML = `<div class="teams">${g.teams.map((t, i) => `<div class="team t${i}"><strong>${esc(t.name)}</strong> <b class="tscore">${t.score}</b><div class="team-ducks">${t.players.map((p) => `<span class="tdk">${duckOf(p)}<em>${nm(p)}${p === me ? " (you)" : ""}</em></span>`).join("")}</div></div>`).join("")}</div>`;
    if (g.phase === "words") {
      if (g.wrote.includes(me)) return { key: `h:${g.gid}:words:done`, html: `${topbar("Duck in a Hat", sub)}<section class="screen center">
        <div class="hero-duck bob">${App.duck({ hat: "top", mood: "happy" })}</div><h1>In the hat!</h1><p class="lead">Waiting for:</p>
        <div data-live="wait">${waitingFor(g.roster.filter((p) => P(p).on), g.wrote)}</div>${hostBar(`<button class="btn btn-small" data-act="forceWords">Fill the rest from the deck</button>`)}</section>` };
      return {
        key: `h:${g.gid}:words`,
        html: `${topbar("Duck in a Hat", sub)}<section class="screen">
          <p class="lead">Secretly write ${g.perPlayer} things for the hat. People, places, films, filth — anything the flock might know.</p>
          <form id="f">${Array.from({ length: g.perPlayer }, (_, k) => `<div class="word-row"><input name="w${k}" maxlength="40" autocomplete="off" placeholder="Thing #${k + 1}"><button type="button" class="icon-btn" data-dice="${k}" aria-label="Random word">🎲</button></div>`).join("")}
          <button class="btn btn-primary btn-xl" type="submit">Into the hat</button></form>
          <h3>Your team</h3>${teamsHTML}${hostBar()}</section>`,
        setup(el) {
          const pool = content.pool(content.hat, O.s.cheeky);
          $$("[data-dice]", el).forEach((b) => (b.onclick = () => { $(`[name=w${b.dataset.dice}]`, el).value = pick(pool); App.sound.pop(); }));
          $("#f", el).onsubmit = (e) => { e.preventDefault(); O.act("words", { words: $$("input", el).map((i) => i.value.trim()) }); };
        },
      };
    }
    if (g.phase === "round") return {
      key: `h:${g.gid}:round:${g.round}`,
      sound: () => App.sound.quack(),
      html: `${topbar("Duck in a Hat", sub)}<section class="screen center">
        <p class="eyebrow">Round ${g.round + 1} of ${g.roundCount}</p><div class="hero-duck bob">${App.duck(ROUND_LOOKS[g.round])}</div>
        <h1>${g.roundName}</h1><p class="rule">${RULES[g.round]}</p><p class="muted">${g.hatSize} words in the hat.</p>
        <button class="btn btn-primary btn-xl" data-act="go">Let's go</button>${teamsHTML}${hostBar()}</section>`,
    };
    const team = g.teams[g.teamPtr], myTeamUp = g.myTeam === g.teamPtr, giving = me === g.giver;
    if (g.phase === "ready") return {
      key: `h:${g.gid}:ready:${g.round}:${g.teamPtr}:${g.giver}`,
      sound: () => (giving ? App.sound.quack(1.2) : App.sound.pop()),
      html: `${topbar("Duck in a Hat", sub)}<section class="screen center">
        <p class="eyebrow team-label t${g.teamPtr}">${esc(team.name)}</p>
        <div class="hero-duck bob">${duckOf(g.giver, { mood: "happy" })}</div>
        <h1>${giving ? "You're up!" : `${nm(g.giver)} is up`}</h1>
        <p class="lead">${giving ? "Your team guesses. Everyone else heckles." : myTeamUp ? "Get ready to shout answers!" : "Other team's turn. You'll see the words — police them. 🚨"}</p>
        <p class="rule small">${RULES[g.round]}</p>
        ${giving ? `<button class="btn btn-primary btn-xl" data-act="startTurn">Start ${g.seconds}s</button>` : `<p class="muted">Waiting for ${nm(g.giver)} to hit start…</p>`}
        ${hostBar(`<button class="btn btn-small" data-act="skipGiver">Skip ${nm(g.giver)}</button>`)}</section>`,
    };
    if (g.phase === "turn") {
      const role = giving ? "giver" : myTeamUp ? "guesser" : "police";
      return {
        key: `h:${g.gid}:turn:${g.round}:${g.teamPtr}:${g.giver}:${role}`,
        sound: () => App.sound.quack(),
        html: `${topbar("Duck in a Hat", `${esc(team.name)} · ${g.roundName}`)}<section class="screen play">${timer(g.deadline, g.seconds)}
          <div data-live="turn">${giving
            ? `<div class="word-card"><span class="wc-label">Your word</span><span>${esc(g.word || "")}</span></div>
               <p class="center muted">${g.got.length} got · ${g.hatSize} in the hat</p>
               <div class="play-btns"><button class="btn btn-bad btn-xl" data-act="skip" data-arg='${arg({ word: g.word })}' ${g.hatSize <= 1 ? "disabled" : ""}>Skip ⏭</button><button class="btn btn-good btn-xl" data-act="got" data-arg='${arg({ word: g.word })}'>Got it! ✅</button></div>`
            : myTeamUp
            ? `<div class="word-card guess-card"><span class="wc-label">${nm(g.giver)} is giving clues</span><span>GUESS! 🗣️</span></div><p class="center lead">${g.got.length} got so far</p>`
            : `<div class="word-card small police"><span class="wc-label">🚨 Police mode — they're trying to get</span><span>${esc(g.word || "")}</span></div><p class="center lead">${esc(team.name)}: ${g.got.length} got so far</p>`}
          ${g.got.length ? `<div class="got-list">${g.got.map((w) => `<span class="chip on">${esc(w)}</span>`).join("")}</div>` : ""}</div>
          ${hostBar()}</section>`,
      };
    }
    if (g.phase === "summary") {
      const last = g.teams[g.lastTeam];
      return {
        key: `h:${g.gid}:summary:${g.round}:${g.lastTeam}:${last.score}:${g.hatSize}`,
        sound: () => App.sound.honk(),
        html: `${topbar("Duck in a Hat", g.emptied ? "The hat is empty!" : "Time's up!")}<section class="screen center">
          <h1>${g.got.length} ${g.got.length === 1 ? "point" : "points"} for ${esc(last.name)}</h1>
          <p class="lead">${g.got.length === 0 ? "Absolutely nothing. A sitting duck." : g.got.length >= 6 ? "Unstoppable. Ducking magnificent." : "Not bad, not bad."}</p>
          ${g.got.length ? `<div class="got-list">${g.got.map((w) => `<span class="chip on">${esc(w)}</span>`).join("")}</div>` : ""}
          ${App.scoreboard(g.teams.map((t) => ({ name: t.name, score: t.score })))}
          <button class="btn btn-primary btn-xl" data-act="next">${g.emptied ? (g.round < g.roundCount - 1 ? `On to Round ${g.round + 2}` : "Final results") : "Next team"}</button>${hostBar()}</section>`,
      };
    }
    const sorted = g.teams.slice().sort((a, b) => b.score - a.score), tie = sorted[1] && sorted[0].score === sorted[1].score;
    return {
      key: `h:${g.gid}:final`,
      sound: () => { App.sound.win(); App.confetti(); },
      html: `${topbar("Duck in a Hat", "Game over")}<section class="screen center">
        <div class="hero-duck bob">${App.duck({ hat: "crown", mood: "happy" })}</div>
        <h1>${tie ? "It's a tie! Everybody's a winner (nobody is)." : `${esc(sorted[0].name)} win!`}</h1>
        ${App.scoreboard(g.teams.map((t) => ({ name: t.name, score: t.score })))}${endButtons()}</section>`,
    };
  };

  /* ================= join / host screens ================= */
  function joinScreen(hosting, code) {
    let look = myLook();
    App.render(`${App.topbar(hosting ? "Host a room" : "Join a room")}
      <section class="screen">
        <div class="center"><button class="mascot bob" id="me" aria-label="Restyle your duck">${App.duck(look)}</button><p class="hint">Tap your duck for a makeover.</p></div>
        <form id="f" class="stack">
          <div class="field"><label for="n">Your name</label><input id="n" maxlength="18" autocomplete="nickname" value="${esc(myName())}" placeholder="e.g. Big Dave"></div>
          ${hosting ? "" : `<div class="field"><label for="c">Room code</label><input id="c" class="code-input" maxlength="4" autocomplete="off" autocapitalize="characters" value="${esc(code || "")}" placeholder="ABCD"></div>`}
          <button class="btn btn-primary btn-xl" type="submit" id="go">${hosting ? "Create the room" : "Waddle in"}</button>
        </form>
        <p class="muted center">${hosting ? "You'll get a code, a link and a QR code for everyone to join on their own phones." : "Ask the host for the 4-letter code, or scan their QR code."}</p>
      </section>`, (el) => {
      $("#me", el).onclick = () => { look = App.duckLook(Math.floor(Math.random() * 1e6)); $("#me", el).innerHTML = App.duck(look); App.sound.quack(1.2); };
      const n = $("#n", el); if (!n.value) n.focus();
      $("#f", el).onsubmit = async (e) => {
        e.preventDefault();
        const name = n.value.trim();
        if (!name) { n.focus(); n.placeholder = "Every duck needs a name!"; return; }
        App.store.set("myName", name); App.store.set("myLook", look);
        const go = $("#go", el); go.disabled = true;
        let c = hosting ? null : $("#c", el).value.trim().toUpperCase();
        if (hosting) {
          try {
            const r = await fetch("/api/rooms", { method: "POST" });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || "Couldn't make a room");
            c = d.code;
          } catch (err) { toast("Couldn't create a room — are you online? " + err.message); go.disabled = false; return; }
        } else if (!/^[A-Z]{4}$/.test(c)) { toast("Room codes are 4 letters."); go.disabled = false; return; }
        App.sound.quack();
        O.connect(c, name, look);
      };
    });
  }
  O.host = () => joinScreen(true);
  O.join = (code) => joinScreen(false, code);

  /** Called on page load: rejoin a room from the URL if there is one. */
  O.boot = function () {
    const code = (new URLSearchParams(location.search).get("room") || "").toUpperCase();
    if (!/^[A-Z]{4}$/.test(code)) return false;
    if (creds(code) && myName()) O.connect(code, myName(), myLook());
    else joinScreen(false, code);
    return true;
  };
})();
