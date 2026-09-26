(() => {
  const body = document.body;
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const realms = [...document.querySelectorAll(".realm")];
  const plates = [...document.querySelectorAll(".plate")];
  const realmIndex = Object.fromEntries(realms.map((r, i) => [r.dataset.kingdom, i]));

  // ---------- Settings ----------
  const LIGHTNING = true;     // occasional flash in the rain panel
  const MAX_PARTICLES = 550;  // lower this if it runs slow on older machines
  const IDLE_MS = 3500;       // UI fades out after this long without mouse movement
  const TOUCH_IDLE_MS = 8000; // longer on touch screens

  // ---------- Canvas ----------
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, edge = 0;
  const particles = [];
  const lit = new Set();

  const rand = (a, b) => a + Math.random() * (b - a);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // match the CSS --fade blend width (e.g. "10vw")
    const fadeVw = parseFloat(getComputedStyle(root).getPropertyValue("--fade")) || 10;
    edge = (W * fadeVw) / 100;
  }

  function getRects() {
    const rects = {};
    for (const r of realms) rects[r.dataset.kingdom] = r.getBoundingClientRect();
    return rects;
  }

  // Fade particles out where one panel blends into the next
  function edgeAlpha(x, k, rect) {
    const i = realmIndex[k];
    let a = 1;
    if (i > 0) a = Math.min(a, (x - rect.left) / edge);
    if (i < realms.length - 1) a = Math.min(a, (rect.right - x) / edge);
    return Math.max(0, Math.min(1, a));
  }

  // Quick fade in, slow fade out, based on a particle's age
  function lifeFade(p, fadeIn) {
    const t = p.life / p.maxLife;
    return t < fadeIn ? t / fadeIn : 1 - (t - fadeIn) / (1 - fadeIn);
  }

  // ---------- Spawning ----------
  // u = horizontal position as a fraction of the panel (0 = left edge, 1 = right edge),
  // so particles stay inside their panel when it widens or shrinks.
  const SPAWN = {
    dark() {
      if (Math.random() < 0.35) {
        particles.push({
          k: "dark", kind: "ember", u: Math.random(), y: H * rand(0.8, 1.02),
          vx: rand(-0.3, 0.3), vy: -rand(0.4, 1.2), size: rand(0.8, 2.2),
          life: 0, maxLife: rand(200, 420), phase: rand(0, Math.PI * 2),
        });
      }
      if (Math.random() < 0.04) {
        particles.push({
          k: "dark", kind: "smoke", u: rand(0.1, 0.9), y: H * rand(0.85, 1.05),
          vx: rand(-0.15, 0.15), vy: -rand(0.2, 0.45), size: rand(40, 80),
          life: 0, maxLife: rand(400, 700),
        });
      }
    },

    mountain() {
      for (let n = 0; n < 3; n++) {
        particles.push({
          k: "mountain", kind: "rain", u: Math.random(), y: rand(-60, -10),
          vx: rand(-2.5, -1.5), vy: rand(13, 19), size: rand(12, 24),
          life: 0, maxLife: 999, stopY: H * rand(0.82, 1.0),
        });
      }
    },

    snow() {
      if (Math.random() < 0.2) {
        const depth = Math.random(); // 0 = far away, 1 = close to the camera
        particles.push({
          k: "snow", kind: "snow", u: Math.random(), y: -10,
          vx: 0, vy: 0.5 + depth * 1.3, size: 0.8 + depth * 2.6,
          depth, life: 0, maxLife: 9999, phase: rand(0, Math.PI * 2),
        });
      }
    },
  };

  // ---------- Drawing each particle type ----------
  const DRAW = {
    ember(p, x, a) {
      p.vx = Math.max(-0.6, Math.min(0.6, p.vx + rand(-0.03, 0.03))); // jittery drift
      const flicker = 0.6 + 0.4 * Math.sin(p.life * 0.25 + p.phase);
      const alpha = lifeFade(p, 0.1) * flicker * a;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(${Math.round(150 + 60 * flicker)}, 90, 255, ${alpha})`; // violet soul-fire
      ctx.shadowColor = "rgb(140, 60, 230)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    },

    smoke(p, x, a) {
      p.size += 0.12; // plumes swell as they rise
      const alpha = lifeFade(p, 0.2) * 0.28 * a;
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.size);
      g.addColorStop(0, `rgba(18, 10, 28, ${alpha})`); // near-black purple
      g.addColorStop(1, "rgba(18, 10, 28, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    },

    rain(p, x, a) {
      const k = p.size / p.vy; // tail length follows the drop's angle
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(185, 205, 235, ${0.35 * a})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, p.y);
      ctx.lineTo(x - p.vx * k, p.y - p.size);
      ctx.stroke();
    },

    splash(p, x, a) {
      const t = p.life / p.maxLife;
      const r = p.size + t * 6;
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(185, 205, 235, ${0.4 * (1 - t) * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, p.y, r, r * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    },

    snow(p, x, a) {
      p.vx = Math.sin(p.life * 0.02 + p.phase) * 0.5 * (0.5 + p.depth); // gentle sway
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
      ctx.shadowBlur = p.depth > 0.7 ? 4 : 0; // soft blur on close flakes
      ctx.fillStyle = `rgba(240, 246, 255, ${(0.35 + 0.55 * p.depth) * a})`;
      ctx.beginPath();
      ctx.arc(x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    },
  };

  // Pulsing violet heat along the bottom of the dark kingdom
  function drawSmolderGlow(rect, t) {
    const pulse = 0.75 + 0.15 * Math.sin(t * 0.0013) + 0.1 * Math.sin(t * 0.0047);
    const cx = rect.left + rect.width / 2;
    const radius = Math.max(rect.width, H * 0.5);

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.left, 0, rect.width, H);
    ctx.clip();

    // the glow itself
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(cx, H * 1.1, 0, cx, H * 1.1, radius);
    g.addColorStop(0, `rgba(140, 60, 220, ${0.3 * pulse})`);
    g.addColorStop(0.5, `rgba(70, 20, 120, ${0.14 * pulse})`);
    g.addColorStop(1, "rgba(30, 0, 60, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(rect.left, 0, rect.width, H);

    // fade the glow out across the blend zone so it doesn't end in a hard line
    ctx.globalCompositeOperation = "destination-out";
    const fadeStart = rect.right - edge * 1.5;
    const eraser = ctx.createLinearGradient(fadeStart, 0, rect.right, 0);
    eraser.addColorStop(0, "rgba(0, 0, 0, 0)");
    eraser.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.fillStyle = eraser;
    ctx.fillRect(fadeStart, 0, rect.right - fadeStart, H);

    ctx.restore();
  }

  // Occasional soft lightning in the rain kingdom
  let flash = 0;
  let nextStrike = 0;
  function drawLightning(rect, t) {
    if (nextStrike === 0) nextStrike = t + rand(4000, 8000);
    if (t > nextStrike && flash <= 0) {
      flash = 1;
      nextStrike = t + rand(7000, 16000);
    }
    if (flash <= 0) return;

    // bright, dip, bright again, then fade
    const f = flash > 0.8 || (flash > 0.5 && flash < 0.65) ? flash : flash * 0.4;
    const es = Math.min(0.45, edge / rect.width);
    const g = ctx.createLinearGradient(rect.left, 0, rect.right, 0);
    g.addColorStop(0, "rgba(210, 225, 255, 0)");
    g.addColorStop(es, `rgba(210, 225, 255, ${0.16 * f})`);
    g.addColorStop(1 - es, `rgba(210, 225, 255, ${0.16 * f})`);
    g.addColorStop(1, "rgba(210, 225, 255, 0)");

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.fillRect(rect.left, 0, rect.width, H);
    ctx.globalCompositeOperation = "source-over";
    flash -= 0.03;
  }

  // ---------- Main loop ----------
  function frame(t) {
    const rects = getRects();
    if (particles.length < MAX_PARTICLES) {
      for (const k of lit) SPAWN[k]();
    }

    ctx.clearRect(0, 0, W, H);
    if (lit.has("dark")) drawSmolderGlow(rects.dark, t);

    const focus = body.dataset.focus;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const rect = rects[p.k];
      p.life++;
      p.u += p.vx / rect.width;
      p.y += p.vy;
      const x = rect.left + p.u * rect.width;

      let dead = p.life >= p.maxLife || p.y < -150 || p.y > H + 20;

      // raindrops hit the ground and sometimes leave a splash
      if (p.kind === "rain" && p.y >= p.stopY) {
        dead = true;
        if (Math.random() < 0.5) {
          particles.push({
            k: p.k, kind: "splash", u: p.u, y: p.stopY,
            vx: 0, vy: 0, size: rand(2, 4), life: 0, maxLife: 14,
          });
        }
      }
      if (dead) { particles.splice(i, 1); continue; }

      let a = edgeAlpha(x, p.k, rect);
      if (focus && focus !== p.k) a *= 0.45; // dim with its panel
      if (a <= 0) continue;

      DRAW[p.kind](p, x, a);
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;

    if (LIGHTNING && lit.has("mountain")) drawLightning(rects.mountain, t);

    requestAnimationFrame(frame);
  }

  // ---------- Intro: panels fade in one by one, then the title ----------
  function intro() {
    const steps = reduceMotion
      ? [[0, "lit-dark"], [0, "lit-mountain"], [0, "lit-snow"], [0, "ready"]]
      : [[200, "lit-dark"], [800, "lit-mountain"], [1400, "lit-snow"], [2100, "ready"]];

    for (const [delay, cls] of steps) {
      setTimeout(() => {
        body.classList.add(cls);
        if (cls.startsWith("lit-")) lit.add(cls.slice(4));
      }, delay);
    }
  }

  // ---------- Showing and hiding the UI ----------
  let idleTimer = 0;
  let leaveTimer = 0;
  let overUI = false; // true while the pointer is over a button

  function setFocus(k) {
    if (!body.classList.contains("ready")) return; // wait for the intro
    clearTimeout(leaveTimer);
    if (body.dataset.focus !== k) {
      body.dataset.focus = k;
      plates.forEach((p) => p.classList.toggle("is-active", p.dataset.kingdom === k));
    }
    body.classList.add("touched"); // hides the "Choose your kingdom" hint for good
  }

  function hideUI() {
    if (overUI || keyboardFocusInUI()) return;
    delete body.dataset.focus;
    plates.forEach((p) => p.classList.remove("is-active"));
  }

  function clearFocus(delay = 0) {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(hideUI, delay);
  }

  function armIdle(ms = IDLE_MS) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(hideUI, ms);
  }

  function keyboardFocusInUI() {
    const el = document.activeElement;
    return el && (el.tagName === "BUTTON" || el.tagName === "A") && el.matches(":focus-visible");
  }

  // Moving over a panel shows that kingdom; stopping for a while hides everything
  realms.forEach((r) => {
    const k = r.dataset.kingdom;
    r.addEventListener("pointermove", (e) => {
      setFocus(k);
      armIdle(e.pointerType === "touch" ? TOUCH_IDLE_MS : IDLE_MS);
    });
    r.addEventListener("pointerdown", (e) => {
      setFocus(k);
      armIdle(e.pointerType === "touch" ? TOUCH_IDLE_MS : IDLE_MS);
    });
  });

  // Mouse leaves the browser window
  root.addEventListener("mouseleave", () => clearFocus(300));

  // Don't hide the UI while the pointer is on a button
   document.querySelectorAll("button, a").forEach((btn) => {
    btn.addEventListener("pointerenter", () => { overUI = true; clearTimeout(idleTimer); });
    btn.addEventListener("pointerleave", () => { overUI = false; armIdle(); });
  });

  // Plate buttons: keyboard focus reveals their kingdom
  plates.forEach((plate) => {
    const k = plate.dataset.kingdom;
    const btn = plate.querySelector(".plate-btn");
    btn.addEventListener("focus", () => setFocus(k));
    btn.addEventListener("blur", () => clearFocus(400));
    btn.addEventListener("click", () => console.log(`Begin as: ${k}`));
  });

  // Corner menu (placeholder until those screens exist)
  document.querySelectorAll(".corner-btn").forEach((btn) => {
    btn.addEventListener("click", () => console.log(`Menu: ${btn.textContent}`));
  });

  // ---------- Subtle mouse parallax on the images ----------
  if (!reduceMotion) {
    const bgs = [...document.querySelectorAll(".realm-bg")];
    window.addEventListener("mousemove", (e) => {
      const dx = (e.clientX / W - 0.5) * -14;
      const dy = (e.clientY / H - 0.5) * -8;
      for (const bg of bgs) bg.style.translate = `${dx}px ${dy}px`;
    });
  }

  // ---------- Start ----------
  resize();
  window.addEventListener("resize", resize);
  if (!reduceMotion) requestAnimationFrame(frame);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(intro);
})();