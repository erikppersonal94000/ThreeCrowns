/* Three Crowns — smoke transition between screens
   A dark curtain with billowing smoke on its edges, animated with
   transform only (GPU composited, no canvas).
     await Smoke.cover();   curtain rises from below until the screen is black
     await Smoke.reveal();  curtain keeps rising and lifts off the top
   The screen manager swaps screens in between, while everything is hidden. */
(() => {
  const COVER_MS = 1300;      // how long the cover takes
  const REVEAL_MS = 1500;     // how long the lift takes
  const PER_ROW = 8;          // puffs per row along an edge
  const WISPS = 4;            // loose wisps ahead of / behind the curtain
  const BASE = "#07050a";     // curtain color (near-black violet)

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- styles (injected so this file is self-contained) ---------- */
  const css = `
    .smoke-overlay {
      position: fixed; inset: 0; z-index: 9999;
      overflow: hidden;
      contain: strict;
    }

    /* Curtain: 220vh tall, soft at both ends, solid in the middle */
    .smoke-veil {
      position: absolute; left: 0; right: 0; top: 0;
      height: 220vh;
      background: linear-gradient(to bottom,
        rgba(7, 5, 10, 0) 0%,
        rgba(14, 9, 20, .75) 12%,
        ${BASE} 22%,
        ${BASE} 78%,
        rgba(14, 9, 20, .75) 88%,
        rgba(7, 5, 10, 0) 100%);
      transform: translate3d(0, 100vh, 0);
      will-change: transform;
    }

    /* Puffs live inside the curtain and ride its edges */
    .smoke-puff {
      position: absolute;
      left: var(--x); top: var(--t);
      width: var(--s); height: var(--s);
      margin-left: calc(var(--s) / -2);
      margin-top: calc(var(--s) / -2);
      border-radius: 50%;
      background: radial-gradient(circle at 50% 50%,
        var(--c) 0%, var(--c2) 36%, rgba(7, 5, 10, 0) 68%);
    }
    .smoke-puff.is-billowing {
      animation: smoke-billow var(--b) ease-in-out var(--bd) infinite alternate;
    }

    /* Covered: curtain fills the screen (used when motion is reduced) */
    .smoke-overlay.is-covered .smoke-veil {
      transform: translate3d(0, -60vh, 0);
    }
    /* Rising from below until the screen is black */
    .smoke-overlay.is-covering .smoke-veil {
      animation: smoke-veil-in ${COVER_MS}ms cubic-bezier(.45, 0, .3, 1) forwards;
    }
    /* Carrying on up and off the top */
    .smoke-overlay.is-revealing .smoke-veil {
      animation: smoke-veil-out ${REVEAL_MS}ms cubic-bezier(.55, 0, .5, 1) forwards;
    }

    @keyframes smoke-veil-in {
      from { transform: translate3d(0, 100vh, 0); }
      to   { transform: translate3d(0, -60vh, 0); }
    }
    @keyframes smoke-veil-out {
      from { transform: translate3d(0, -60vh, 0); }
      to   { transform: translate3d(0, -230vh, 0); }
    }
    @keyframes smoke-billow {
      from { transform: translate3d(0, 0, 0) scale(1); }
      to   { transform: translate3d(var(--dx), var(--dy), 0) scale(var(--sc)); }
    }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- building the curtain ---------- */
  const rand = (a, b) => a + Math.random() * (b - a);

  // lit smoke (shows against the dark) and deep smoke (blends into the curtain)
  const LIGHT = [
    ["rgba(98, 76, 126, .55)", "rgba(40, 28, 58, .55)"],
    ["rgba(82, 66, 104, .5)",  "rgba(34, 24, 48, .55)"],
    ["rgba(112, 90, 140, .45)", "rgba(46, 32, 66, .5)"],
  ];
  const DEEP = ["rgba(18, 12, 28, .95)", "rgba(12, 8, 18, .75)"];
  const WISP = ["rgba(120, 100, 150, .28)", "rgba(52, 38, 72, .22)"];

  function addPuff(veil, { x, t, s, c, billow }) {
    const p = document.createElement("div");
    p.className = billow ? "smoke-puff is-billowing" : "smoke-puff";
    p.style.setProperty("--x", `${x}%`);
    p.style.setProperty("--t", `${t}%`);
    p.style.setProperty("--s", `${s}vmax`);
    p.style.setProperty("--c", c[0]);
    p.style.setProperty("--c2", c[1]);
    if (billow) {
      p.style.setProperty("--dx", `${rand(-3, 3)}vw`);
      p.style.setProperty("--dy", `${rand(-4, 2)}vh`);
      p.style.setProperty("--sc", rand(1.08, 1.22).toFixed(2));
      p.style.setProperty("--b", `${Math.round(rand(900, 1600))}ms`);
      p.style.setProperty("--bd", `${Math.round(rand(-1600, 0))}ms`); // start mid-billow
    }
    veil.appendChild(p);
  }

  // A row of puffs across the width, between two heights (in % of the curtain)
  function row(veil, count, tMin, tMax, sMin, sMax, colors, billow) {
    for (let i = 0; i < count; i++) {
      addPuff(veil, {
        x: -6 + (i / (count - 1)) * 112 + rand(-3, 3),
        t: rand(tMin, tMax),
        s: rand(sMin, sMax),
        c: Array.isArray(colors[0]) ? colors[i % colors.length] : colors,
        billow,
      });
    }
  }

  function buildOverlay() {
    const el = document.createElement("div");
    el.className = "smoke-overlay";
    el.setAttribute("aria-hidden", "true");

    const veil = document.createElement("div");
    veil.className = "smoke-veil";

    // leading edge (top)
    row(veil, WISPS, 2, 11, 20, 34, WISP, true);
    row(veil, PER_ROW, 11, 21, 34, 52, LIGHT, true);
    row(veil, PER_ROW, 19, 27, 38, 56, DEEP, false);
    // trailing edge (bottom)
    row(veil, PER_ROW, 73, 81, 38, 56, DEEP, false);
    row(veil, PER_ROW, 79, 89, 34, 52, LIGHT, true);
    row(veil, WISPS, 89, 98, 20, 34, WISP, true);

    el.appendChild(veil);
    document.body.appendChild(el);
    return el;
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let overlay = null;

  /* ---------- cover: resolves once the screen is fully dark ---------- */
  async function cover() {
    overlay?.remove();
    overlay = buildOverlay();

    if (reduceMotion) {
      overlay.classList.add("is-covered");
      return;
    }

    void overlay.offsetWidth; // make sure it starts from the bottom
    overlay.classList.add("is-covering");
    await wait(COVER_MS + 30);
  }

  /* ---------- reveal: resolves once the smoke has lifted away ---------- */
  async function reveal() {
    const el = overlay;
    if (!el) return;

    if (!reduceMotion) {
      el.classList.add("is-revealing");
      await wait(REVEAL_MS + 30);
    }

    el.remove();
    if (overlay === el) overlay = null;
  }

  window.Smoke = { cover, reveal };
})();