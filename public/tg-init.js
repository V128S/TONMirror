/**
 * Telegram Mini App initialization script.
 * Loaded as early as possible from <head> — before React hydration.
 *
 * Order: expand() → requestFullscreen() → ready()
 * Calling expand() before ready() means the app is revealed at full height
 * (Telegram shows the Mini App exactly when ready() fires).
 */
(function () {
  function run(tg) {
    try { tg.expand(); } catch (e) {}
    try {
      if (typeof tg.requestFullscreen === "function") tg.requestFullscreen();
    } catch (e) {}
    try { tg.ready(); } catch (e) {}
  }

  var tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    run(tg);
    return;
  }

  // Fallback: poll every 10 ms for up to 1 second in case Telegram injects
  // window.Telegram.WebApp asynchronously (some Android builds).
  var attempts = 0;
  var interval = setInterval(function () {
    var tg2 = window.Telegram && window.Telegram.WebApp;
    if (tg2) {
      run(tg2);
      clearInterval(interval);
    } else if (++attempts >= 100) {
      clearInterval(interval);
    }
  }, 10);
})();
