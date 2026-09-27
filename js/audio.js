// Shared music and sound manager for every page.
//   GameAudio.music("audio/x.mp3")  start (or crossfade to) a looping track
//   GameAudio.fadeOut(1200)         fade the current track out
//   GameAudio.sfx("audio/x.mp3")    play a one-shot sound effect
// Also adds a mute button to the bottom-left corner of the page.
(() => {
  const MUTE_KEY = "tc-muted";
  const MUSIC_VOLUME = 0.05;

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

  // ---------- Smoke whoosh (made in code, no audio file needed) ----------
  const SMOKE_VOLUME = 0.1; // raise or lower to taste
  let ctx = null;
  let noiseBuf = null;

  function audioCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // 4 seconds of brown noise (a deep, soft rushing sound), made once and reused
  function brownNoise(c) {
    if (noiseBuf) return noiseBuf;
    const len = c.sampleRate * 4;
    noiseBuf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = noiseBuf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3.5;
      }
    }
    return noiseBuf;
  }

  // Timed to the smoke: swells as it rises (0–1.3s), settles while the
  // screen is covered, then exhales as it lifts away (~1.9–3.6s)
  function smoke(volume = SMOKE_VOLUME) {
    if (muted) return;
    const c = audioCtx();
    const t = c.currentTime;
    const buf = brownNoise(c);

    const out = c.createGain();
    out.gain.value = volume;
    out.connect(c.destination);

    // Layer 1: the rushing whoosh (noise through a sweeping band filter)
    const rush = c.createBufferSource();
    rush.buffer = buf;
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.7;
    band.frequency.setValueAtTime(250, t);
    band.frequency.exponentialRampToValueAtTime(1400, t + 1.2); // rising
    band.frequency.exponentialRampToValueAtTime(500, t + 1.9);  // covered
    band.frequency.exponentialRampToValueAtTime(900, t + 2.8);  // lifting away
    band.frequency.exponentialRampToValueAtTime(300, t + 3.6);
    const rushGain = c.createGain();
    rushGain.gain.setValueAtTime(0.0001, t);
    rushGain.gain.exponentialRampToValueAtTime(1, t + 1.1);
    rushGain.gain.exponentialRampToValueAtTime(0.45, t + 1.9);
    rushGain.gain.exponentialRampToValueAtTime(0.7, t + 2.6);
    rushGain.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    const pan = c.createStereoPanner();
    pan.pan.setValueAtTime(-0.4, t);
    pan.pan.linearRampToValueAtTime(0.4, t + 3.6); // drifts across the speakers
    rush.connect(band).connect(rushGain).connect(pan).connect(out);

    // Layer 2: a low rumble underneath
    const rumble = c.createBufferSource();
    rumble.buffer = buf;
    rumble.playbackRate.value = 0.5;
    const low = c.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 120;
    const rumbleGain = c.createGain();
    rumbleGain.gain.setValueAtTime(0.0001, t);
    rumbleGain.gain.exponentialRampToValueAtTime(1.4, t + 1.2);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    rumble.connect(low).connect(rumbleGain).connect(out);

    rush.start(t);
    rush.stop(t + 3.7);
    rumble.start(t);
    rumble.stop(t + 3.7);
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

  window.GameAudio = { music, fadeOut, sfx, smoke, setMuted, isMuted: () => muted };
})();