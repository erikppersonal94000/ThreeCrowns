(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Card data ----------
  // Add new cards here; the page builds itself from this list.
  // Leave out "cost" for heroes (the kingdom seal shows instead).
  const CARDS = [
    {
      id: "morvane",
      kingdom: "dark",
      name: "Morvane the Bone-Caller",
      typeLine: "Hero of Duskmoor",
      art: "graphics/cards/necromancer.svg",
      health: 30,
      abilities: [
        { name: "Grave Harvest", cost: 2, text: "Return a minion from your discard pile to your hand." },
        { name: "Deathless", text: "Whenever one of your minions dies, gain 1 Soul." },
      ],
      flavor: "Every grave is a door, and I hold every key.",
    },
  ];

  // ---------- Frame pieces (500 x 700 layout) ----------
  const ARCH = "M40 392 V160 Q40 100 250 70 Q460 100 460 160 V392 Z";
  const OUTER =
    "M24 0 H476 A24 24 0 0 1 500 24 V676 A24 24 0 0 1 476 700 H24 A24 24 0 0 1 0 676 V24 A24 24 0 0 1 24 0 Z " +
    "M30 16 H470 A14 14 0 0 1 484 30 V670 A14 14 0 0 1 470 684 H30 A14 14 0 0 1 16 670 V30 A14 14 0 0 1 30 16 Z";

  const spine = (x) =>
    Array.from({ length: 24 }, (_, i) => `<use href="#cf-vertebra" x="${x}" y="${112 + i * 20}"/>`).join("");

  const crossed = (x, y) =>
    `<use href="#cf-bone-piece" transform="translate(${x} ${y}) rotate(45)"/>` +
    `<use href="#cf-bone-piece" transform="translate(${x} ${y}) rotate(-45)"/>`;

  // Duskmoor crescent, shown in the top-left seal on hero cards
  const SIGIL =
    `<path transform="translate(36 36)" d="M38 8 A22 22 0 1 0 54 40 A17 17 0 1 1 38 8 Z" fill="#8a4dd6" filter="url(#fx-cglow)"/>`;

  // Cracked crystal heart for health
  const HEART = `
    <path d="M440 686 C414 668 402 654 402 640 C402 628 411 620 421 620 C430 620 436 626 440 632 C444 626 450 620 459 620 C469 620 478 628 478 640 C478 654 466 668 440 686 Z"
          fill="url(#cf-gem-radial)" stroke="url(#cf-bone)" stroke-width="3.5"/>
    <path d="M440 632 L436 646 L444 654 L438 670" fill="none" stroke="#1a0f24" stroke-width="1.4"/>`;

  function frontSVG(card) {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="#07050a"/>

      <!-- art in the gothic arch -->
      <image href="${card.art}" x="40" y="60" width="420" height="332"
             preserveAspectRatio="xMidYMid slice" clip-path="url(#cf-arch)"/>
      <path d="${ARCH}" fill="url(#cf-art-vignette)"/>
      <path d="M26 392 V156 Q26 88 250 50 Q474 88 474 156 V392" fill="none" stroke="#3b2752" stroke-width="1.2"/>
      <path d="${ARCH}" fill="none" stroke="url(#cf-iron)" stroke-width="10"/>
      <path d="${ARCH}" fill="none" stroke="#8a4dd6" stroke-width="1.5" opacity=".8"/>

      <!-- iron frame with a spine down each side -->
      <path d="${OUTER}" fill="url(#cf-iron)" fill-rule="evenodd"/>
      <rect x="16" y="16" width="468" height="668" rx="14" fill="none" stroke="#5b3f7a" stroke-width="1.5"/>
      ${spine(8)}${spine(492)}
      ${crossed(460, 40)}${crossed(40, 660)}

      <!-- bone wings and horned skull crest -->
      <g fill="none" stroke="url(#cf-bone)" stroke-width="4" stroke-linecap="round">
        <path d="M230 40 Q190 30 150 42 M230 46 Q196 42 164 54 M232 52 Q204 52 180 64"/>
        <path d="M270 40 Q310 30 350 42 M270 46 Q304 42 336 54 M268 52 Q296 52 320 64"/>
      </g>
      <path d="M233 24 C222 18 216 10 218 2 C223 10 229 14 237 17 Z M267 24 C278 18 284 10 282 2 C277 10 271 14 263 17 Z"
            fill="#1a1222" stroke="#5b3f7a" stroke-width="1"/>
      <use href="#cf-skull" x="250" y="36"/>

      <!-- name plate -->
      <path d="M44 388 H456 L474 414 L456 440 H44 L26 414 Z" fill="url(#cf-plate)" stroke="#000" stroke-width="2"/>
      <path d="M50 394 H450 L464 414 L450 434 H50 L36 414 Z" fill="none" stroke="#8a4dd6" stroke-width="1" opacity=".7"/>
      <path class="cf-gem" d="M26 414 l8 -8 8 8 -8 8 z M458 414 l8 -8 8 8 -8 8 z" fill="url(#cf-gem)"/>

      <!-- text box with bone corner brackets -->
      <rect x="48" y="476" width="404" height="148" rx="6" fill="url(#cf-textbox)" stroke="#5b3f7a" stroke-width="1.5"/>
      <path d="M56 498 V484 H70 M444 498 V484 H430 M56 602 V616 H70 M444 602 V616 H430"
            fill="none" stroke="url(#cf-bone)" stroke-width="3" stroke-linecap="round"/>

      <!-- top-left seal: cost, or the kingdom sigil for heroes -->
      <circle cx="66" cy="66" r="36" fill="url(#cf-iron)" stroke="url(#cf-bone)" stroke-width="3"/>
      <circle cx="66" cy="66" r="30" fill="#140c1e" stroke="#8a4dd6" stroke-width="1"/>
      ${card.cost == null ? SIGIL : ""}

      ${card.health != null ? HEART : ""}

      <!-- rarity gem -->
      <path class="cf-gem" d="M250 660 l12 14 -12 14 -12 -14 z" fill="url(#cf-gem)" stroke="#000" stroke-width="1"/>
    </svg>`;
  }

  function backSVG() {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="url(#cb-bg)"/>
      <rect x="16" y="16" width="468" height="668" rx="14" fill="url(#cb-lattice)"/>
      <path d="${OUTER}" fill="url(#cf-iron)" fill-rule="evenodd"/>
      <rect x="16" y="16" width="468" height="668" rx="14" fill="none" stroke="#5b3f7a" stroke-width="1.5"/>
      <rect x="40" y="40" width="420" height="620" rx="10" fill="none" stroke="#8a4dd6" stroke-width="1" opacity=".5"/>
      ${spine(8)}${spine(492)}
      ${crossed(40, 40)}${crossed(460, 40)}${crossed(40, 660)}${crossed(460, 660)}

      <path d="M250 230 A110 110 0 0 0 250 450 A125 125 0 0 1 250 230 Z" fill="#4a2272" filter="url(#fx-cglow)"/>
      <use href="#cf-skull" transform="translate(272 336) scale(3)"/>

      <text x="250" y="560" text-anchor="middle" font-family="Grenze Gotisch, serif" font-weight="800"
            font-size="46" letter-spacing="2" fill="#b58bdc">Duskmoor</text>
    </svg>`;
  }

  const abilityHTML = (a) =>
    `<p><span class="ability-name">${a.name}</span>` +
    (a.cost != null ? `<span class="soul-cost" aria-label="${a.cost} Souls">${a.cost}</span>` : "") +
    `${a.text}</p>`;

  function cardHTML(card, large = false) {
    const label = large
      ? `${card.name}. Select to flip.`
      : `${card.name}, ${card.typeLine}. Select to inspect.`;

    return `
    <article class="card" data-id="${card.id}" data-kingdom="${card.kingdom}" tabindex="0" role="button" aria-label="${label}">
      <div class="card-inner">
        <div class="card-face card-front">
          ${frontSVG(card)}
          ${card.cost != null ? `<span class="card-cost">${card.cost}</span>` : ""}
          <h3 class="card-name">${card.name}</h3>
          <p class="card-type">${card.typeLine}</p>
          <div class="card-text">
            ${card.abilities.map(abilityHTML).join("")}
            ${card.flavor ? `<p class="card-flavor">${card.flavor}</p>` : ""}
          </div>
          ${card.health != null ? `<span class="card-health">${card.health}</span>` : ""}
          <div class="card-sheen"></div>
        </div>
        <div class="card-face card-back">${backSVG()}</div>
      </div>
    </article>`;
  }

  // ---------- 3D tilt ----------
  function resetTilt(el) {
    el.classList.remove("is-tilting");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  function attachTilt(el, max) {
    if (reduceMotion) return;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.classList.add("is-tilting");
      el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
      el.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    });
    el.addEventListener("pointerleave", () => resetTilt(el));
  }

  // ---------- Grid ----------
  const grid = document.getElementById("card-grid");
  grid.innerHTML = CARDS.map((c) => cardHTML(c)).join("");
  document.getElementById("card-count").textContent =
    `${CARDS.length} ${CARDS.length === 1 ? "card" : "cards"}`;

  grid.querySelectorAll(".card").forEach((el) => {
    attachTilt(el, 10);
    const open = () => { resetTilt(el); openInspect(el.dataset.id); };
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });

  // ---------- Inspect view ----------
  const dialog = document.getElementById("inspect");
  const stage = document.getElementById("inspect-stage");

  function openInspect(id) {
    const card = CARDS.find((c) => c.id === id);
    stage.innerHTML = cardHTML(card, true);
    const el = stage.querySelector(".card");
    attachTilt(el, 14);
    const flip = () => el.classList.toggle("is-flipped");
    el.addEventListener("click", flip);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
    });
    dialog.showModal();
  }

  document.getElementById("flip-btn").addEventListener("click", () => {
    stage.querySelector(".card")?.classList.toggle("is-flipped");
  });
  document.getElementById("close-btn").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); // click the backdrop

  // ---------- Drifting violet motes behind everything ----------
  if (!reduceMotion) {
    const canvas = document.getElementById("motes");
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const newMote = (anywhere) => ({
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      r: 0.6 + Math.random() * 1.8,
      vy: 0.15 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      a: 0.25 + Math.random() * 0.5,
    });
    const motes = Array.from({ length: 70 }, () => newMote(true));

    (function loop() {
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
      requestAnimationFrame(loop);
    })();
  }
})();