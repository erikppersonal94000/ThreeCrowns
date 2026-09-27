(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // =====================================================================
  // Card data
  // Add new cards here; the page builds itself from this list.
  // Leave out "cost" for heroes (the Duskmoor seal shows instead).
  // Optional: artAlign ("xMidYMin" | "xMidYMid" | "xMidYMax") picks which
  // part of the art stays visible when it's cropped to the arch.
  // =====================================================================
  const CARDS = [
    {
      id: "morvane",
      type: "hero",
      kingdom: "dark",
      name: "Morvane the Bone-Caller",
      typeLine: "Hero of Duskmoor",
      art: "graphics/cards/necromancer-painted.svg",
      health: 30,
      abilities: [
        { name: "Grave Harvest", cost: 2, text: "Return a minion from your discard pile to your hand." },
        { name: "Deathless", text: "Whenever one of your minions dies, gain 1 Soul." },
      ],
      flavor: "Every grave is a door, and I hold every key.",
      label: "Hero",
    },

    // Blank attack card frames, one per rarity. Fill in name/art/cost/attack/abilities later.
    { id: "attack-common",    type: "attack", kingdom: "dark", rarity: "common",    label: "Common" },
    { id: "attack-uncommon",  type: "attack", kingdom: "dark", rarity: "uncommon",  label: "Uncommon" },
    { id: "attack-rare",      type: "attack", kingdom: "dark", rarity: "rare",      label: "Rare" },
    { id: "attack-legendary", type: "attack", kingdom: "dark", rarity: "legendary", label: "Legendary" },
  ];

  // =====================================================================
  // Frame layout (500 x 700)
  // =====================================================================
  const ARCH = "M40 392 V160 Q40 100 250 70 Q460 100 460 160 V392 Z";
  const INNER = "M30 16 H470 A14 14 0 0 1 484 30 V670 A14 14 0 0 1 470 684 H30 A14 14 0 0 1 16 670 V30 A14 14 0 0 1 30 16 Z";
  const OUTER = "M24 0 H476 A24 24 0 0 1 500 24 V676 A24 24 0 0 1 476 700 H24 A24 24 0 0 1 0 676 V24 A24 24 0 0 1 24 0 Z " + INNER;
  const PLATE = "M44 388 H456 L474 414 L456 440 H44 L26 414 Z";
  const PLATE_IN = "M50 394 H450 L464 414 L450 434 H50 L36 414 Z";
  const BRACKETS = "M56 498 V484 H70 M444 498 V484 H430 M56 602 V616 H70 M444 602 V616 H430";
  const WINGS = "M230 40 Q190 30 150 42 M230 46 Q196 42 164 54 M232 52 Q204 52 180 64 " +
                "M270 40 Q310 30 350 42 M270 46 Q304 42 336 54 M268 52 Q296 52 320 64";
  const HORNS = "M233 24 C222 18 216 10 218 2 C223 10 229 14 237 17 Z M267 24 C278 18 284 10 282 2 C277 10 271 14 263 17 Z";
  const HEART = "M440 686 C414 668 402 654 402 640 C402 628 411 620 421 620 C430 620 436 626 440 632 C444 626 450 620 459 620 C469 620 478 628 478 640 C478 654 466 668 440 686 Z";
  const CRESCENT_BIG = "M250 230 A110 110 0 0 0 250 450 A125 125 0 0 1 250 230 Z";

  const artImage = (card) =>
    `<image href="${card.art}" x="40" y="60" width="420" height="332" preserveAspectRatio="${card.artAlign || "xMidYMid"} slice" clip-path="url(#cf-arch)"/>`;

  const spine = (x) =>
    Array.from({ length: 24 }, (_, i) => `<use href="#fb-vertebra" x="${x}" y="${112 + i * 20}"/>`).join("");

  const crossed = (x, y) =>
    `<use href="#fb-bone-piece" transform="translate(${x} ${y}) rotate(45)"/>` +
    `<use href="#fb-bone-piece" transform="translate(${x} ${y}) rotate(-45)"/>`;

  // engraved thorn vine for the upper-left corner (mirrored for the right)
  const VINE =
    "M34 170 C34 112 84 76 158 58 " +
    "M70 104 C62 90 70 78 82 80 C90 82 88 92 80 92 " +
    "M120 76 C116 62 128 54 138 58 C146 62 142 72 134 70 " +
    "M50 128 l-7 -3 M60 110 l-6 -6 M92 86 l-3 -7 M140 64 l-2 -7";

  const FILIGREE = `
    <g fill="none" stroke-linecap="round">
      <path d="${VINE}" stroke="#000" stroke-width="2.4" opacity=".7" transform="translate(0 1)"/>
      <path d="${VINE}" stroke="#8f76b8" stroke-width="1.2" opacity=".8"/>
      <g transform="translate(500 0) scale(-1 1)">
        <path d="${VINE}" stroke="#000" stroke-width="2.4" opacity=".7" transform="translate(0 1)"/>
        <path d="${VINE}" stroke="#8f76b8" stroke-width="1.2" opacity=".8"/>
      </g>
    </g>`;

  const HEART_FACETS = `
    <g clip-path="url(#fb-heart-clip)">
      <path d="M440 632 L402 640 L421 620 Z" fill="#fff" opacity=".28"/>
      <path d="M440 632 L478 640 L459 620 Z" fill="#fff" opacity=".12"/>
      <path d="M440 632 L402 640 L440 686 Z" fill="#000" opacity=".22"/>
      <path d="M440 632 L478 640 L440 686 Z" fill="#000" opacity=".08"/>
    </g>`;

  // Duskmoor seal: silver-rimmed crescent cradling a small skull, with a few stars
  const star = (x, y, s) =>
    `<path d="M${x} ${y - s} L${x + s * 0.25} ${y - s * 0.25} L${x + s} ${y} L${x + s * 0.25} ${y + s * 0.25} L${x} ${y + s} L${x - s * 0.25} ${y + s * 0.25} L${x - s} ${y} L${x - s * 0.25} ${y - s * 0.25} Z"/>`;

  const SIGIL = `
    <defs>
      <mask id="fb-moon-mask" maskUnits="userSpaceOnUse" x="30" y="30" width="72" height="72">
        <circle cx="62" cy="67" r="21" fill="#fff"/>
        <circle cx="71" cy="61" r="17.5" fill="#000"/>
      </mask>
    </defs>
    <g filter="url(#fb-blur4)" opacity=".6">
      <circle cx="62" cy="67" r="21" fill="#9b5ce6" mask="url(#fb-moon-mask)"/>
    </g>
    <circle cx="62" cy="67" r="21" fill="url(#fb-crescent)" mask="url(#fb-moon-mask)"/>
    <g fill="none" stroke="#efe6fb" stroke-width="1.8" mask="url(#fb-moon-mask)">
      <circle cx="62" cy="67" r="21"/>
      <circle cx="71" cy="61" r="17.5"/>
    </g>
    <use href="#fb-skull" transform="translate(72 64) scale(.36)"/>
    <g fill="#e6d4ff" class="cf-gem">
      ${star(82, 47, 2.6)}
      ${star(88, 62, 1.6)}
      ${star(78, 82, 1.8)}
    </g>`;

  // =====================================================================
  // Card front
  // =====================================================================
  function frontSVG(card) {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="#07050a"/>

      <!-- inset metal panel around the art -->
      <path d="${INNER} ${ARCH}" fill="url(#fb-panel)" fill-rule="evenodd" filter="url(#fb-metalfx)"/>
      ${FILIGREE}

      <!-- art with a soft inner shadow -->
      ${artImage(card)}
      <path d="${ARCH}" fill="url(#cf-art-vignette)"/>
      <g clip-path="url(#cf-arch)">
        <path d="${ARCH}" fill="none" stroke="#000" stroke-width="22" opacity=".85" filter="url(#fb-blur4)"/>
      </g>
      <path d="${ARCH}" fill="none" stroke="url(#fb-metal)" stroke-width="12" filter="url(#fb-metalfx)"/>
      <path d="${ARCH}" fill="none" stroke="#b27bff" stroke-width="1.4" opacity=".9" filter="url(#fb-glow)"/>

      <!-- outer frame -->
      <path d="${OUTER}" fill="url(#fb-metal)" fill-rule="evenodd" filter="url(#fb-metalfx)"/>
      <rect x="21" y="21" width="458" height="658" rx="11" fill="none" stroke="#7d5fb0" stroke-width=".8" opacity=".55"/>

      <!-- vertebrae and corner bone clusters -->
      <g filter="url(#fb-bonefx)">
        ${spine(8)}${spine(492)}
        ${crossed(460, 40)}${crossed(40, 660)}
      </g>
      <use href="#fb-skull" transform="translate(460 40) scale(.55)"/>
      <use href="#fb-skull" transform="translate(40 660) scale(.55)"/>

      <!-- bone wings and horned crest -->
      <path d="${WINGS}" fill="none" stroke="#1a1222" stroke-width="6" stroke-linecap="round" transform="translate(0 1.5)"/>
      <path d="${WINGS}" fill="none" stroke="url(#fb-bone)" stroke-width="4" stroke-linecap="round" filter="url(#fb-bonefx)"/>
      <path d="${HORNS}" fill="url(#fb-horn)" filter="url(#fb-metalfx)"/>
      <path d="M226 20 Q224 14 220 10 M230 18 Q226 12 222 8 M274 20 Q276 14 280 10 M270 18 Q274 12 278 8"
            fill="none" stroke="#000" stroke-width=".7" opacity=".6"/>
      <use href="#fb-skull" x="250" y="36"/>

      <!-- name plate with enamel inlay -->
      <path d="${PLATE}" fill="url(#fb-metal-h)" filter="url(#fb-metalfx)"/>
      <path d="${PLATE_IN}" fill="url(#fb-enamel)"/>
      <path d="${PLATE_IN}" fill="none" stroke="#c49cff" stroke-width=".8" opacity=".6"/>
      <use href="#fb-gem" transform="translate(34 414)"/>
      <use href="#fb-gem" transform="translate(466 414)"/>

      <!-- text box -->
      <rect x="48" y="476" width="404" height="148" rx="6" fill="url(#fb-inset)" filter="url(#fb-canvasfx)"/>
      <g clip-path="url(#fb-tb-clip)">
        <rect x="48" y="476" width="404" height="148" rx="6" fill="none" stroke="#000" stroke-width="14" opacity=".8" filter="url(#fb-blur4)"/>
      </g>
      <rect x="48" y="476" width="404" height="148" rx="6" fill="none" stroke="url(#fb-metal)" stroke-width="3" filter="url(#fb-metalfx)"/>
      <path d="${BRACKETS}" fill="none" stroke="url(#fb-bone)" stroke-width="3.2" stroke-linecap="round" filter="url(#fb-bonefx)"/>

      <!-- seal: cost, or the Duskmoor sigil for heroes -->
      <circle cx="66" cy="66" r="36" fill="url(#fb-metal)" filter="url(#fb-metalfx)"/>
      <circle cx="66" cy="66" r="29" fill="url(#fb-enamel)"/>
      <circle cx="66" cy="66" r="32.5" fill="none" stroke="#c9b6e6" stroke-width="1.2" stroke-dasharray="1.5 4" opacity=".6"/>
      ${card.cost == null ? SIGIL : ""}

      <!-- faceted crystal heart -->
      ${card.health != null ? `
        <ellipse cx="440" cy="650" rx="44" ry="40" fill="#8a4dd6" opacity=".35" filter="url(#fb-blur4)"/>
        <path d="${HEART}" fill="url(#cf-gem-radial)"/>
        ${HEART_FACETS}
        <path d="M440 632 L436 646 L444 654 L438 670" fill="none" stroke="#1a0f24" stroke-width="1.2"/>
        <ellipse cx="424" cy="632" rx="7" ry="3" transform="rotate(-30 424 632)" fill="#fff" opacity=".6" filter="url(#fb-glow)"/>
        <path d="${HEART}" fill="none" stroke="url(#fb-bone)" stroke-width="4" filter="url(#fb-bonefx)"/>` : ""}

      <!-- rarity gem -->
      <use href="#fb-gem" transform="translate(250 674) scale(1.4)"/>
    </svg>`;
  }

  // =====================================================================
  // Card back
  // =====================================================================
  function backSVG() {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="url(#cb-bg)"/>
      <rect x="16" y="16" width="468" height="668" rx="14" fill="url(#cb-lattice)"/>
      <path d="${OUTER}" fill="url(#fb-metal)" fill-rule="evenodd" filter="url(#fb-metalfx)"/>
      <rect x="21" y="21" width="458" height="658" rx="11" fill="none" stroke="#7d5fb0" stroke-width=".8" opacity=".55"/>
      <rect x="40" y="40" width="420" height="620" rx="10" fill="none" stroke="url(#fb-metal)" stroke-width="4" filter="url(#fb-metalfx)"/>
      <g filter="url(#fb-bonefx)">
        ${spine(8)}${spine(492)}
        ${crossed(40, 40)}${crossed(460, 40)}
        ${crossed(40, 660)}${crossed(460, 660)}
      </g>
      <ellipse cx="250" cy="340" rx="150" ry="150" fill="#6a34b0" opacity=".25" filter="url(#fb-blur4)"/>
      <path d="${CRESCENT_BIG}" fill="url(#fb-enamel)"/>
      <path d="${CRESCENT_BIG}" fill="none" stroke="url(#fb-metal)" stroke-width="6" filter="url(#fb-metalfx)"/>
      <use href="#fb-skull" transform="translate(272 336) scale(3)"/>
      <text x="250" y="562" text-anchor="middle" font-family="Grenze Gotisch, serif" font-weight="800"
            font-size="46" letter-spacing="2" fill="#000" opacity=".6">Duskmoor</text>
      <text x="250" y="560" text-anchor="middle" font-family="Grenze Gotisch, serif" font-weight="800"
            font-size="46" letter-spacing="2" fill="url(#fb-crescent)">Duskmoor</text>
    </svg>`;
  }

  // =====================================================================
  // Attack card frames (common / uncommon / rare / legendary)
  // =====================================================================
  const RARITY = {
    common:    { level: 0, gem: ["#b4aebb", "#77717f", "#3a3640"] },  // dull grey stone
    uncommon:  { level: 1, gem: ["#ffffff", "#d3cee0", "#8a8496"] },  // pale silver
    rare:      { level: 2, gem: ["#e3c6ff", "#9b5ce6", "#2a0c4f"] },  // violet
    legendary: { level: 3, gem: ["#ffd9f7", "#d24fd0", "#4a0c52"] },  // magenta
  };

  // Art window shapes: plain rectangle, gentle arch, full gothic arch
  const WINDOWS = [
    "M40 72 H460 V392 H40 Z",
    "M40 392 V122 Q250 78 460 122 V392 Z",
    ARCH,
  ];

  // Faceted gem in any three colors (light, mid, dark)
  const facetGem = (x, y, s, [c0, c1, c2], cls = "") => `
    <g transform="translate(${x} ${y}) scale(${s})" class="${cls}">
      <path d="M0 -9 L9 0 L0 9 L-9 0 Z" fill="${c2}"/>
      <path d="M0 -9 L9 0 L0 0 Z" fill="${c0}"/>
      <path d="M0 -9 L-9 0 L0 0 Z" fill="${c1}"/>
      <path d="M-9 0 L0 9 L0 0 Z" fill="${c2}" opacity=".8"/>
      <path d="M9 0 L0 9 L0 0 Z" fill="${c1}" opacity=".8"/>
      <path d="M0 -9 L9 0 L0 9 L-9 0 Z" fill="none" stroke="#0a0610" stroke-width="1"/>
      <circle cx="2" cy="-3" r="1.2" fill="#fff" opacity=".9"/>
    </g>`;

  const RIVETS = `
    <g fill="#4a4058" filter="url(#fb-metalfx)">
      <circle cx="32" cy="32" r="5"/><circle cx="468" cy="32" r="5"/>
      <circle cx="32" cy="668" r="5"/><circle cx="468" cy="668" r="5"/>
    </g>`;

  // Attack emblem (bottom right), shaped like a blade
  const BLADE = "M440 610 L476 644 L440 692 L404 644 Z";
  const BLADE_IN = "M440 620 L466 644 L440 680 L414 644 Z";

  // Soul wisps that drift up the legendary frame
  const WISPS = [
    [8, 600, 0], [492, 520, 2.5], [8, 380, 5], [492, 260, 1.2], [140, 64, 3.6], [360, 64, 6],
  ].map(([x, y, d]) =>
    `<circle class="lg-wisp" cx="${x}" cy="${y}" r="3" fill="#e0a8ff" filter="url(#fb-glow)" style="animation-delay:-${d}s"/>`
  ).join("");

  function attackFrontSVG(card) {
    const r = RARITY[card.rarity] || RARITY.common;
    const L = r.level;
    const win = WINDOWS[Math.min(L, 2)];
    const gold = L >= 3;
    const metal = L === 0 ? "url(#ac-iron)" : "url(#fb-metal)";
    const accent = gold ? "url(#ac-gold)" : "#b27bff";
    const bladeLine = L === 0 ? "#5a5660" : gold ? "url(#ac-gold)" : L >= 2 ? "url(#fb-bone)" : "#c49cff";
    const uid = `ac-${card.id}`;

    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <defs>
        <clipPath id="${uid}-win"><path d="${win}"/></clipPath>
        <radialGradient id="ac-empty" cx=".5" cy=".45" r=".7">
          <stop offset="0" stop-color="#2a1640"/>
          <stop offset=".6" stop-color="#140a20"/>
          <stop offset="1" stop-color="#07040b"/>
        </radialGradient>
        <linearGradient id="ac-iron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a4650"/>
          <stop offset=".5" stop-color="#16141a"/>
          <stop offset="1" stop-color="#2c2930"/>
        </linearGradient>
        <linearGradient id="ac-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e8c878"/>
          <stop offset=".5" stop-color="#7a5a24"/>
          <stop offset="1" stop-color="#b8904a"/>
        </linearGradient>
      </defs>

      <rect width="500" height="700" rx="24" fill="#07050a"/>

      <!-- inset panel around the art window -->
      <path d="${INNER} ${win}" fill="url(#fb-panel)" fill-rule="evenodd" filter="url(#fb-metalfx)"/>
      ${L >= 2 ? FILIGREE : ""}

      <!-- empty art window -->
      <path d="${win}" fill="url(#ac-empty)"/>
      <path d="${win}" fill="url(#cf-art-vignette)"/>
      <g clip-path="url(#${uid}-win)">
        <path d="${win}" fill="none" stroke="#000" stroke-width="22" opacity=".85" filter="url(#fb-blur4)"/>
      </g>
      <path d="${win}" fill="none" stroke="${L === 0 ? "url(#ac-iron)" : "url(#fb-metal)"}" stroke-width="${L === 0 ? 8 : 12}" filter="url(#fb-metalfx)"/>
      ${L >= 1 ? `<path class="${gold ? "lg-rim" : ""}" d="${win}" fill="none" stroke="${accent}" stroke-width="${gold ? 2 : 1.2}" opacity=".9" ${L >= 2 ? 'filter="url(#fb-glow)"' : ""}/>` : ""}

      <!-- outer frame -->
      <path d="${OUTER}" fill="${metal}" fill-rule="evenodd" filter="url(#fb-metalfx)"/>
      ${L >= 1 ? `<rect x="21" y="21" width="458" height="658" rx="11" fill="none" stroke="${gold ? "url(#ac-gold)" : "#7d5fb0"}" stroke-width="${gold ? 1.4 : 0.8}" opacity="${gold ? 0.9 : 0.55}"/>` : ""}
      ${L <= 1 ? RIVETS : ""}

      <!-- spine and crossed bones (rare and up) -->
      ${L >= 2 ? `
        <g filter="url(#fb-bonefx)">
          ${spine(8)}${spine(492)}
          ${crossed(460, 40)}${crossed(40, 660)}
        </g>` : ""}
      ${L >= 3 ? `
        <use href="#fb-skull" transform="translate(460 40) scale(.55)"/>
        <use href="#fb-skull" transform="translate(40 660) scale(.55)"/>` : ""}

      <!-- crest -->
      ${L >= 2 ? `
        <path d="${WINGS}" fill="none" stroke="#1a1222" stroke-width="6" stroke-linecap="round" transform="translate(0 1.5)"/>
        <path d="${WINGS}" fill="none" stroke="url(#fb-bone)" stroke-width="4" stroke-linecap="round" filter="url(#fb-bonefx)"/>` : ""}
      ${L >= 3 ? `
        <path d="${HORNS}" fill="url(#fb-horn)" filter="url(#fb-metalfx)"/>
        <path d="M226 20 Q224 14 220 10 M230 18 Q226 12 222 8 M274 20 Q276 14 280 10 M270 18 Q274 12 278 8"
              fill="none" stroke="#000" stroke-width=".7" opacity=".6"/>` : ""}
      ${L === 1 ? `<use href="#fb-skull" transform="translate(250 38) scale(.62)"/>` : ""}
      ${L >= 2 ? `<use href="#fb-skull" x="250" y="36"/>` : ""}

      <!-- name plate (empty) -->
      <path d="${PLATE}" fill="${L === 0 ? "url(#ac-iron)" : "url(#fb-metal-h)"}" filter="url(#fb-metalfx)"/>
      ${L >= 1
        ? `<path d="${PLATE_IN}" fill="url(#fb-enamel)"/>
           <path d="${PLATE_IN}" fill="none" stroke="${gold ? "url(#ac-gold)" : "#c49cff"}" stroke-width=".8" opacity=".7"/>`
        : `<path d="${PLATE_IN}" fill="#0f0d12"/>`}
      ${L >= 2 ? facetGem(34, 414, 1, r.gem, "cf-gem") + facetGem(466, 414, 1, r.gem, "cf-gem") : ""}

      <!-- text box (empty) -->
      <rect x="48" y="476" width="404" height="148" rx="6" fill="url(#fb-inset)" filter="url(#fb-canvasfx)"/>
      <g clip-path="url(#fb-tb-clip)">
        <rect x="48" y="476" width="404" height="148" rx="6" fill="none" stroke="#000" stroke-width="14" opacity=".8" filter="url(#fb-blur4)"/>
      </g>
      <rect x="48" y="476" width="404" height="148" rx="6" fill="none" stroke="${metal}" stroke-width="3" filter="url(#fb-metalfx)"/>
      ${L >= 2 ? `<path d="${BRACKETS}" fill="none" stroke="${gold ? "url(#ac-gold)" : "url(#fb-bone)"}" stroke-width="3.2" stroke-linecap="round" filter="url(#fb-bonefx)"/>` : ""}

      <!-- cost seal (empty) -->
      <circle cx="66" cy="66" r="36" fill="${metal}" filter="url(#fb-metalfx)"/>
      <circle cx="66" cy="66" r="29" fill="${L === 0 ? "#0f0d12" : "url(#fb-enamel)"}"/>
      ${L >= 1 ? `<circle cx="66" cy="66" r="32.5" fill="none" stroke="${gold ? "url(#ac-gold)" : "#c9b6e6"}" stroke-width="1.2" stroke-dasharray="1.5 4" opacity=".7"/>` : ""}

      <!-- attack emblem (empty) -->
      ${L >= 2 ? `<ellipse cx="440" cy="650" rx="40" ry="44" fill="${gold ? "#d24fd0" : "#8a4dd6"}" opacity=".3" filter="url(#fb-blur4)"/>` : ""}
      <path d="${BLADE}" fill="${metal}" filter="url(#fb-metalfx)"/>
      <path d="${BLADE_IN}" fill="${L === 0 ? "#0f0d12" : "url(#fb-enamel)"}"/>
      <path d="${BLADE_IN}" fill="none" stroke="${bladeLine}" stroke-width="${L >= 2 ? 2.2 : 1}" ${L >= 2 ? 'filter="url(#fb-bonefx)"' : ""}/>
      <path d="M422 632 H458" stroke="${bladeLine}" stroke-width="2" stroke-linecap="round"/>

      <!-- rarity gem -->
      ${gold ? `<ellipse cx="250" cy="674" rx="26" ry="22" fill="#d24fd0" opacity=".45" filter="url(#fb-blur4)"/>` : ""}
      ${facetGem(250, 674, gold ? 2 : 1.4, r.gem, L >= 2 ? "cf-gem" : "")}

      ${gold ? WISPS : ""}
    </svg>`;
  }

  // =====================================================================
  // Card HTML
  // =====================================================================

  const abilityHTML = (a) =>
    `<p><span class="ability-name">${a.name}</span>` +
    (a.cost != null ? `<span class="soul-cost" aria-label="${a.cost} Souls">${a.cost}</span>` : "") +
    `${a.text}</p>`;

  function cardHTML(card, large = false) {
    const title = card.name || `Blank ${card.label || ""} card`;
    const label = large ? `${title}. Select to flip.` : `${title}. Select to inspect.`;
    const front = card.type === "hero" ? frontSVG(card) : attackFrontSVG(card);
    const abilities = card.abilities || [];

    return `
    <article class="card" data-id="${card.id}" data-kingdom="${card.kingdom}" data-type="${card.type}"
             ${card.rarity ? `data-rarity="${card.rarity}"` : ""}
             tabindex="0" role="button" aria-label="${label}">
      <div class="card-inner">
        <div class="card-face card-front">
          ${front}
          ${card.cost != null ? `<span class="card-cost">${card.cost}</span>` : ""}
          ${card.name ? `<h3 class="card-name">${card.name}</h3>` : ""}
          ${card.typeLine ? `<p class="card-type">${card.typeLine}</p>` : ""}
          ${abilities.length || card.flavor ? `
            <div class="card-text">
              ${abilities.map(abilityHTML).join("")}
              ${card.flavor ? `<p class="card-flavor">${card.flavor}</p>` : ""}
            </div>` : ""}
          ${card.health != null ? `<span class="card-health">${card.health}</span>` : ""}
          ${card.attack != null ? `<span class="card-attack">${card.attack}</span>` : ""}
          <div class="card-sheen"></div>
        </div>
        <div class="card-face card-back">${backSVG()}</div>
      </div>
    </article>`;
  }

  // =====================================================================
  // 3D tilt
  // =====================================================================
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

  // =====================================================================
  // Grid
  // =====================================================================
  const grid = document.getElementById("card-grid");
    grid.innerHTML = CARDS.map((c) => `
    <figure class="card-slot">
      ${cardHTML(c)}
      ${c.label ? `<figcaption class="card-caption">${c.label}</figcaption>` : ""}
    </figure>`).join("");
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

  // =====================================================================
  // Inspect view
  // =====================================================================
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
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

  // =====================================================================
  // Drifting violet motes behind everything
  // =====================================================================
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