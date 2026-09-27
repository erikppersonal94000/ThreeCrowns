// Rising-smoke page transition, shared by every page.
//   Smoke.cover("page.html")  -> smoke rises, fills the screen, then goes to that page.
// The page you arrive on clears the smoke by itself (as long as it includes this file).
(() => {
  const KEY = "smoke-reveal";
  const BG = "#07050b";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Arriving through the smoke: keep the page hidden until the smoke is drawn ----------
  const arriving = sessionStorage.getItem(KEY) === "1";
  if (arriving) {
    sessionStorage.removeItem(KEY);
    document.documentElement.style.background = BG;
    const hold = document.createElement("style");
    hold.id = "smoke-hold";
    hold.textContent = "body { visibility: hidden; }";
    document.head.appendChild(hold);
  }

  // ---------- Helpers ----------
  function makeCanvas() {
    const c = document.createElement("canvas");
    c.className = "smoke-canvas";
    c.style.cssText = "position:fixed;inset:0;width:100%;height:100%;z-index:9999;pointer-events:auto;";
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c, ctx, W, H };
  }

  // dark violet smoke colors
  const COLORS = ["26,14,40", "40,20,62", "18,10,28", "58,28,90"];

  function puff(W, H, y, big) {
    return {
      x: Math.random() * W,
      y,
      r: (big ? 160 : 60) + Math.random() * 120,
      vy: -(H / 90 + Math.random() * (H / 120)),
      vx: (Math.random() - 0.5) * 1.2,
      grow: 1.8 + Math.random() * 2.2,
      a: 0.55 + Math.random() * 0.35,
      rgb: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  function drawPuff(ctx, p, alphaMul) {
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    g.addColorStop(0, `rgba(${p.rgb}, ${p.a * alphaMul})`);
    g.addColorStop(0.6, `rgba(${p.rgb}, ${p.a * alphaMul * 0.5})`);
    g.addColorStop(1, `rgba(${p.rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // violet sparks caught in the smoke
  function spark(W, H) {
    return { x: Math.random() * W, y: H + Math.random() * 40, vy: -(3 + Math.random() * 5), r: 0.8 + Math.random() * 1.6 };
  }

  // ---------- Leaving: smoke rises and fills the screen ----------
  let leaving = false;

  function cover(url) {
    if (leaving) return;
    leaving = true;
    sessionStorage.setItem(KEY, "1");

    if (reduceMotion) { fadeOnly(url); return; }

    const { ctx, W, H } = makeCanvas();
    const puffs = [];
    const sparks = [];
    const start = performance.now();
    const DURATION = 1300;

    function frame(now) {
      const t = now - start;

      // new puffs along the bottom, thicker as it goes
      const n = t < 900 ? 6 : 3;
      for (let i = 0; i < n; i++) puffs.push(puff(W, H, H + 80 + Math.random() * 60, t > 400));
      if (Math.random() < 0.5) sparks.push(spark(W, H));

      ctx.clearRect(0, 0, W, H);

      // solid darkness climbing up behind the smoke front
      const fill = Math.min(1, Math.max(0, (t - 250) / (DURATION - 350)));
      const top = H - fill * (H + 200);
      const lg = ctx.createLinearGradient(0, top, 0, top + 200);
      lg.addColorStop(0, "rgba(7, 5, 11, 0)");
      lg.addColorStop(1, BG);
      ctx.fillStyle = lg;
      ctx.fillRect(0, top, W, H - top + 10);

      // the billowing smoke
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.y += p.vy;
        p.x += p.vx;
        p.r += p.grow;
        if (p.y + p.r < -50) { puffs.splice(i, 1); continue; }
        drawPuff(ctx, p, 1);
      }

      // sparks
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(190, 130, 255, 0.8)";
      for (const s of sparks) {
        s.y += s.vy;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      if (t < DURATION) {
        requestAnimationFrame(frame);
      } else {
        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, W, H);
        window.location.href = url;
      }
    }
    requestAnimationFrame(frame);
  }

  // Reduced motion: a quick fade instead of smoke
  function fadeOnly(url) {
    const d = document.createElement("div");
    d.className = "smoke-canvas";
    d.style.cssText = `position:fixed;inset:0;background:${BG};opacity:0;transition:opacity .3s ease;z-index:9999;`;
    document.body.appendChild(d);
    requestAnimationFrame(() => { d.style.opacity = "1"; });
    setTimeout(() => { window.location.href = url; }, 320);
  }

  // ---------- Arriving: the smoke lifts and clears ----------
  function reveal() {
    const hold = document.getElementById("smoke-hold");
    if (reduceMotion) { hold?.remove(); return; }

    const { c, ctx, W, H } = makeCanvas();
    c.style.pointerEvents = "none";

    // start with the screen full of smoke, then show the page underneath
    const puffs = Array.from({ length: 70 }, () => {
      const p = puff(W, H, Math.random() * H * 1.2, true);
      p.vy *= 0.35;
      return p;
    });
    hold?.remove();

    const start = performance.now();
    const DURATION = 1500;

    function frame(now) {
      const t = (now - start) / DURATION;
      ctx.clearRect(0, 0, W, H);

      // the solid darkness lifts upward off the page
      const edge = H * (1 - t * 1.4);
      if (edge > 0) {
        const lg = ctx.createLinearGradient(0, edge - 200, 0, edge);
        lg.addColorStop(0, BG);
        lg.addColorStop(1, "rgba(7, 5, 11, 0)");
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, W, edge);
      }

      // leftover smoke drifts up and thins out
      const fade = Math.max(0, 1 - t);
      for (const p of puffs) {
        p.y += p.vy;
        p.x += p.vx;
        p.r += p.grow * 0.6;
        drawPuff(ctx, p, fade);
      }

      if (t < 1) requestAnimationFrame(frame);
      else c.remove();
    }
    requestAnimationFrame(frame);
  }

  if (arriving) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", reveal);
    else reveal();
  }

  // If the player comes back with the browser's Back button, clear any leftover smoke
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      document.querySelectorAll(".smoke-canvas").forEach((el) => el.remove());
      leaving = false;
    }
  });
  // Any link marked data-smoke leaves through the smoke
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-smoke]");
    if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    cover(link.getAttribute("href"));
  });

  window.Smoke = { cover };
})();