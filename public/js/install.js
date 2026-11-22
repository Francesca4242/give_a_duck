/* Installability: service worker for offline play + an "Add to home screen" nudge
   (Android/Chrome gets a real install button; iPhone gets Share-sheet instructions). */
(function () {
  const bar = document.getElementById("install");
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const dismissed = () => App.store.get("installDismissed", false);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
  if (standalone || dismissed()) return;

  function show(html, onInstall) {
    bar.innerHTML = `<span class="ib-duck">${App.duck({ hat: "party", mood: "happy" })}</span>
      <span class="ib-text">${html}</span>
      ${onInstall ? `<button class="btn btn-primary btn-small" id="ib-go">Install</button>` : ""}
      <button class="icon-btn small" id="ib-x" aria-label="Dismiss">✕</button>`;
    bar.hidden = false;
    if (onInstall) document.getElementById("ib-go").onclick = onInstall;
    document.getElementById("ib-x").onclick = () => { bar.hidden = true; App.store.set("installDismissed", true); };
  }

  // Android / desktop Chrome / Edge
  let deferred;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    show("<b>Install the app</b> — full screen, works offline.", async () => {
      bar.hidden = true;
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null;
    });
  });
  window.addEventListener("appinstalled", () => { bar.hidden = true; });

  // iPhone / iPad Safari: no install prompt API, so explain the Share-sheet route.
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) {
    setTimeout(() => show(`<b>Install on iPhone:</b> tap <span class="share-ico" aria-label="Share">⬆︎</span> Share, then <b>Add to Home Screen</b>.`), 1500);
  }
})();
