// Shared music and sound manager for every page.
//   GameAudio.music("audio/x.mp3")  start (or crossfade to) a looping track
//   GameAudio.fadeOut(1200)         fade the current track out
//   GameAudio.sfx("audio/x.mp3")    play a one-shot sound effect
// Also adds a mute button to the bottom-left corner of the page.
(() => {
  const MUTE_KEY = "tc-muted";
  const MUSIC_VOLUME = 0.15;

  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}

  let current = null; // { el, src }

  // Smoothly move a track's volume to a target
  function fade(el, to, ms, done) {
    const from = el.volume;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / ms);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (t < 1) requestAnimationFrame(step);
      else if (done) done();
    }
    requestAnimationFrame(step);
  }

  // Browsers may block sound until the player interacts; if so, start on the first click or key press
  function tryPlay(el) {
    el.play().catch(() => {
      const go = () => {
        el.play().catch(() => {});
        window.removeEventListener("pointerdown", go);
        window.removeEventListener("keydown", go);
      };
      window.addEventListener("pointerdown", go);
      window.addEventListener("keydown", go);
    });
  }

  function music(src, { volume = MUSIC_VOLUME, fadeMs = 1500 } = {}) {
    if (current && current.src === src) return;
    const old = current;

    const el = new Audio(src);
    el.loop = true;
    el.volume = 0;
    el.muted = muted;
    el.addEventListener("error", () => console.warn(`Music file not found: ${src}`));
    current = { el, src };

    tryPlay(el);
    fade(el, volume, fadeMs);
    if (old) fade(old.el, 0, fadeMs, () => old.el.pause());
  }

  function fadeOut(ms = 1200) {
    if (!current) return;
    const c = current;
    current = null;
    fade(c.el, 0, ms, () => c.el.pause());
  }

  function sfx(src, volume = 0.7) {
    if (muted) return;
    const a = new Audio(src);
    a.volume = volume;
    a.play().catch(() => {});
  }

  // ---------- Mute button ----------
  const ICON_ON = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor" stroke="none"/>
      <path d="M16 9 Q18.5 12 16 15 M18.5 6.5 Q23 12 18.5 17.5"/>
    </svg>`;
  const ICON_OFF = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 9 H8 L13 5 V19 L8 15 H4 Z" fill="currentColor" stroke="none"/>
      <path d="M16.5 9.5 L21.5 14.5 M21.5 9.5 L16.5 14.5"/>
    </svg>`;

  let button = null;

  function updateButton() {
    if (!button) return;
    button.innerHTML = muted ? ICON_OFF : ICON_ON;
    button.setAttribute("aria-pressed", String(muted));
    button.setAttribute("aria-label", muted ? "Unmute music" : "Mute music");
    button.title = muted ? "Sound off" : "Sound on";
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch (e) {}
    if (current) current.el.muted = m;
    updateButton();
  }

  function addButton() {
    const style = document.createElement("style");
    style.textContent = `
      .sound-toggle {
        position: fixed; left: 16px; bottom: 16px; z-index: 50;
        display: grid; place-items: center;
        width: 40px; height: 40px; padding: 0;
        color: #d8c6f0;
        background: rgba(14, 9, 22, .7);
        border: 1px solid rgba(138, 77, 214, .45);
        border-radius: 50%;
        cursor: pointer;
        opacity: .65;
        transition: opacity .2s ease, box-shadow .2s ease;
      }
      .sound-toggle:hover, .sound-toggle:focus-visible {
        opacity: 1; outline: none;
        box-shadow: 0 0 16px rgba(138, 77, 214, .5);
      }
      .sound-toggle svg { width: 20px; height: 20px; }
    `;
    document.head.appendChild(style);

    button = document.createElement("button");
    button.className = "sound-toggle";
    button.addEventListener("click", () => setMuted(!muted));
    document.body.appendChild(button);
    updateButton();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton);
  else addButton();

  window.GameAudio = { music, fadeOut, sfx, setMuted, isMuted: () => muted };
})();