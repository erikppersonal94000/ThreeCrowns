/* Three Crowns — smoke page transition
   A dark curtain with billowing smoke along its edges, animated with
   transform + opacity only (GPU composited, no canvas).
   Leaving: the curtain rises from below and covers the screen, then we navigate.
   Arriving: the page loads under the curtain, then the curtain lifts away. */
(() => {
  const KEY = "smoke-reveal";
  const COVER_MS = 1500;      // how long the cover takes
  const REVEAL_MS = 1700;     // how long the lift takes
  const MAX_WAIT_MS = 3000;   // never hold the dark screen longer than this
  const PER_ROW = 9;          // puffs per row along an edge
  const WISPS = 5;            // loose wisps ahead of / behind the curtain
  const BASE = "#07050a";     // curtain color (near-black violet)

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- styles (injected so this file is self-contained) ---------- */
  const css = `
    /* Hold the last frame of this page on screen until the next page can draw */
    @view-transition { navigation: auto; }
    ::view-transition-old(root),
    ::view-transition-new(root) { animation: none; }

    html.smoke-covered,
    html.smoke-arriving { background: ${BASE}; }
    html.smoke-arriving body { visibility: hidden; }

    .smoke-overlay {
      position: fixed; inset: 0; z-index: 9999;
      overflow: hidden; pointer-events: none;
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
      animation: smoke-billow var(--b) ease-in-out var(--bd) infinite alternate;
    }

    /* Leaving: curtain rises from below until it covers the screen */
    .smoke-overlay.is-covering .smoke-veil {
      animation: smoke-veil-in ${COVER_MS}ms cubic-bezier(.45, 0, .3, 1) forwards;
    }
    /* Arriving: start covered, then lift away */
    .smoke-overlay.is-covered .smoke-veil {
      transform: translate3d(0, -60vh, 0);
    }
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

    /* Freeze everything else on the page while leaving */
    html.smoke-leaving body > :not(.smoke-overlay),
    html.smoke-leaving body > :not(.smoke-overlay) * {
      animation-play-state: paused !important;
      transition: none !important;
    }
    /* Once fully dark, stop painting the old page at all */
    html.smoke-covered body > :not(.smoke-overlay) {
      visibility: hidden !important;
    }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  (document.head || root).appendChild(style);

  /* ---------- build the overlay ---------- */
  const rand = (a, b) => a + Math.random() * (b - a);

  // lit smoke (shows against the dark) and deep smoke (blends into the curtain)
  const LIGHT = [
    ["rgba(98, 76, 126, .55)", "rgba(40, 28, 58, .55)"],
    ["rgba(82, 66, 104, .5)",  "rgba(34, 24, 48, .55)"],
    ["rgba(112, 90, 140, .45)", "rgba(46, 32, 66, .5)"],
  ];
  const DEEP = ["rgba(18, 12, 28, .95)", "rgba(12, 8, 18, .75)"];
  const WISP = ["rgba(120, 100, 150, .28)", "rgba(52, 38, 72, .22)"];

  function addPuff(veil, { x, t, s, c }) {
    const p = document.createElement("div");
    p.className = "smoke-puff";
    p.style.setProperty("--x", `${x}%`);
    p.style.setProperty("--t", `${t}%`);
    p.style.setProperty("--s", `${s}vmax`);
    p.style.setProperty("--c", c[0]);
    p.style.setProperty("--c2", c[1]);
    p.style.setProperty("--dx", `${rand(-3, 3)}vw`);
    p.style.setProperty("--dy", `${rand(-4, 2)}vh`);
    p.style.setProperty("--sc", rand(1.08, 1.22).toFixed(2));
    p.style.setProperty("--b", `${Math.round(rand(900, 1600))}ms`);
    p.style.setProperty("--bd", `${Math.round(rand(-1600, 0))}ms`); // start mid-billow
    veil.appendChild(p);
  }

  // Build a row of puffs spread across the width, between two heights (in % of the veil)
  function row(veil, count, tMin, tMax, sMin, sMax, colors) {
    for (let i = 0; i < count; i++) {
      addPuff(veil, {
        x: -6 + (i / (count - 1)) * 112 + rand(-3, 3),
        t: rand(tMin, tMax),
        s: rand(sMin, sMax),
        c: Array.isArray(colors[0]) ? colors[i % colors.length] : colors,
      });
    }
  }

  // mode "cover" decorates the top edge; mode "reveal" decorates the bottom edge
  function buildOverlay(mode, stateClass) {
    const el = document.createElement("div");
    el.className = "smoke-overlay " + stateClass;
    el.setAttribute("aria-hidden", "true");

    const veil = document.createElement("div");
    veil.className = "smoke-veil";

    if (mode === "cover") {
      row(veil, WISPS, 2, 11, 20, 34, WISP);          // wisps leading the way
      row(veil, PER_ROW, 11, 21, 34, 52, LIGHT);      // lit billows on the edge
      row(veil, PER_ROW, 19, 27, 38, 56, DEEP);       // dark body behind them
    } else {
      row(veil, PER_ROW, 73, 81, 38, 56, DEEP);
      row(veil, PER_ROW, 79, 89, 34, 52, LIGHT);
      row(veil, WISPS, 89, 98, 20, 34, WISP);         // wisps trailing behind
    }

    el.appendChild(veil);
    document.body.appendChild(el);
    return el;
  }

  /* ---------- prefetch ---------- */
  const prefetched = new Set();
  function prefetch(url) {
    if (!url || prefetched.has(url)) return;
    prefetched.add(url);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
  }

  /* ---------- leaving ---------- */
  let leaving = false;
  function cover(url) {
    if (leaving) return;
    leaving = true;

    if (reduceMotion) { location.href = url; return; }

    prefetch(url);
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    if (window.GameAudio && GameAudio.fadeOut) GameAudio.fadeOut(COVER_MS - 100);

    root.classList.add("smoke-leaving");
    const overlay = buildOverlay("cover", "");
    void overlay.offsetWidth; // flush styles so the animation starts from the bottom
    requestAnimationFrame(() => overlay.classList.add("is-covering"));

    setTimeout(() => {
      root.classList.add("smoke-covered");
      // one painted frame of pure dark, then go
      requestAnimationFrame(() => requestAnimationFrame(() => { location.href = url; }));
    }, COVER_MS + 50);
  }

  /* ---------- arriving ---------- */
  let arriving = false;
  try { arriving = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
  if (arriving) {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    if (reduceMotion) arriving = false;
  }

  if (arriving) {
    root.classList.add("smoke-arriving");

    const onReady = (fn) =>
      document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", fn, { once: true })
        : fn();

    onReady(() => {
      const overlay = buildOverlay("reveal", "is-covered");
      root.classList.remove("smoke-arriving");

      const loaded = document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((r) => window.addEventListener("load", r, { once: true }));
      const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
      const images = loaded.then(() =>
        Promise.all([...document.images].map((img) =>
          img.decode ? img.decode().catch(() => {}) : null)));
      const timeout = new Promise((r) => setTimeout(r, MAX_WAIT_MS));

      Promise.race([Promise.all([loaded, fonts, images]), timeout]).then(() => {
        // two frames so the page has painted once under the smoke
        requestAnimationFrame(() => requestAnimationFrame(() => {
          overlay.classList.add("is-revealing");
          setTimeout(() => overlay.remove(), REVEAL_MS + 300);
        }));
      });
    });
  }

  /* ---------- back/forward cache cleanup ---------- */
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    leaving = false;
    root.classList.remove("smoke-leaving", "smoke-covered", "smoke-arriving");
    document.querySelectorAll(".smoke-overlay").forEach((o) => o.remove());
  });

  /* ---------- links with data-smoke ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[data-smoke]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    e.preventDefault();
    cover(a.href);
  });

  // start fetching the next page as soon as the pointer or focus lands on a link
  const warm = (e) => {
    const a = e.target.closest && e.target.closest("a[data-smoke]");
    if (a) prefetch(a.href);
  };
  document.addEventListener("pointerover", warm, { passive: true });
  document.addEventListener("focusin", warm);

  window.Smoke = { cover, prefetch };
})();