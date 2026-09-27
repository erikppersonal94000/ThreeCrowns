/* Three Crowns — screen manager
   The whole game is one page. Each screen is a <section class="screen" id="screen-NAME">,
   and only one is visible at a time.

     Screens.register("name", {
       music: "audio/x.mp3",   // optional: crossfade to this track (null = fade music out,
                               //           leave it out = keep whatever is playing)
       enter() { ... },        // runs just before the screen is shown: start loops, reset things.
                               // May return a promise (e.g. images loading); the smoke waits for it.
       exit()  { ... },        // runs as the smoke starts to cover it: stop loops, close dialogs
     });

     Screens.go("name");       // or any element with data-screen="name"
*/
(() => {
  const MAX_WAIT_MS = 2500; // never hold the smoke longer than this waiting for enter()

  const handlers = {};
  const screenEl = (name) => document.getElementById("screen-" + name);
  let current = document.querySelector(".screen:not([hidden])")?.id.replace("screen-", "") ?? null;
  let busy = false;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const nextFrames = (n) => new Promise((r) => {
    const step = () => (--n <= 0 ? r() : requestAnimationFrame(step));
    requestAnimationFrame(step);
  });

  function register(name, h) {
    handlers[name] = h;
  }

  async function go(name) {
    const toEl = screenEl(name);
    if (busy || name === current || !toEl) return;
    busy = true;

    const from = current;
    const fromEl = screenEl(from);
    const next = handlers[name] || {};

    try {
      // Music starts changing right away so it crossfades under the smoke
      if (window.GameAudio && "music" in next) {
        if (next.music) GameAudio.music(next.music);
        else GameAudio.fadeOut(1200);
      }

      // Old screen: stop its loops and freeze it while the smoke rises
      handlers[from]?.exit?.();
      fromEl?.classList.add("is-frozen");

      await Smoke.cover();

      // Swap while the screen is black
      if (fromEl) {
        fromEl.hidden = true;
        fromEl.classList.remove("is-frozen");
      }
      const ready = next.enter?.();
      toEl.hidden = false;
      toEl.scrollTop = 0;
      current = name;

      // Keyboard focus moves to the new screen
      toEl.tabIndex = -1;
      toEl.focus({ preventScroll: true });

      // Wait for the new screen's images, then give it two frames to draw
      await Promise.race([Promise.resolve(ready), wait(MAX_WAIT_MS)]);
      await nextFrames(2);

      await Smoke.reveal();
    } finally {
      busy = false;
    }
  }

  // Any button with data-screen="name" switches to that screen
  document.addEventListener("click", (e) => {
    const target = e.target.closest?.("[data-screen]");
    if (!target) return;
    e.preventDefault();
    go(target.dataset.screen);
  });

  window.Screens = {
    register,
    go,
    get current() { return current; },
  };
})();