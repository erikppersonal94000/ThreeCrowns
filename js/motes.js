/* Three Crowns — drifting violet motes on a canvas.
   Used by the Duskmoor hub and the card library.
     const motes = Motes(canvasElement);
     motes.start();  // begin drawing
     motes.stop();   // pause (the canvas keeps its last frame)
*/
window.Motes = function (canvas, count = 70) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0;
  let running = false;
  let rafId = 0;
  let motes = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const newMote = (anywhere) => ({
    x: Math.random() * W,
    y: anywhere ? Math.random() * H : H + 10,
    r: 0.6 + Math.random() * 1.8,
    vy: 0.15 + Math.random() * 0.45,
    phase: Math.random() * Math.PI * 2,
    a: 0.25 + Math.random() * 0.5,
  });

  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "rgb(140, 60, 230)";
    ctx.shadowBlur = 8;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.phase += 0.01;
      m.y -= m.vy;
      m.x += Math.sin(m.phase) * 0.3;
      if (m.y < -10) motes[i] = newMote(false);
      ctx.fillStyle = `rgba(180, 120, 255, ${m.a})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    rafId = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => { if (running) resize(); });

  return {
    start() {
      if (running || reduceMotion) return;
      running = true;
      resize();
      if (!motes.length) motes = Array.from({ length: count }, () => newMote(true));
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
  };
};