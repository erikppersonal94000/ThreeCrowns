(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Card data ----------
  // Add new cards here; the page builds itself from this list.
  // Leave out "cost" for heroes (the kingdom seal shows instead).
  // "frame" picks the card style: "a" illustrated, "b" painted, "c" realistic.
  const MORVANE = {
    kingdom: "dark",
    name: "Morvane the Bone-Caller",
    typeLine: "Hero of Duskmoor",
    health: 30,
    abilities: [
      { name: "Grave Harvest", cost: 2, text: "Return a minion from your discard pile to your hand." },
      { name: "Deathless", text: "Whenever one of your minions dies, gain 1 Soul." },
    ],
    flavor: "Every grave is a door, and I hold every key.",
  };

  // Temporary: two options for comparison. Delete one once you pick.
  const CARDS = [
    {
      ...MORVANE,
      id: "morvane-1",
      frame: "b",
      art: "graphics/cards/necromancer-painted.svg",
      styleLabel: "Option 1",
    },
        {
      ...MORVANE,
      id: "morvane-2",
      frame: "b",
      art: "graphics/cards/necromancer-hero.jpg",
      artAlign: "xMidYMin",   // keep the top of the image so his hood and face show
      styleLabel: "Option 2",
    },
  ];

  // ---------- Shared layout (500 x 700). All three styles use the same positions. ----------
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
  const CRESCENT_SMALL = "M38 8 A22 22 0 1 0 54 40 A17 17 0 1 1 38 8 Z";
  const CRESCENT_BIG = "M250 230 A110 110 0 0 0 250 450 A125 125 0 0 1 250 230 Z";

    // artAlign controls which part of the image stays visible when it's cropped to the arch:
  // "xMidYMin" = keep the top, "xMidYMid" = keep the center (default), "xMidYMax" = keep the bottom
  const artImage = (card) =>
    `<image href="${card.art}" x="40" y="60" width="420" height="332" preserveAspectRatio="${card.artAlign || "xMidYMid"} slice" clip-path="url(#cf-arch)"/>`;

  // Optional photo layered over the background art, blended into the scene.
  // figureScale:   1 = fills the arch height, 0.8 = 80% size, etc.
  // figureOffsetY: moves the figure down (positive) or up (negative), in card pixels.
  // figureFloorY:  where his feet touch the ground (card pixels, arch bottom is 392).
  const figureImage = (card) => {
    const scale = card.figureScale ?? 1;
    const w = 420 * scale;
    const h = 332 * scale;
    const x = 40 + (420 - w) / 2;
    const y = 60 + (332 - h) + (card.figureOffsetY ?? 0);
    const floor = card.figureFloorY ?? 360;

    return `
    <defs>
      <!-- light purple grade + extra contrast, no outline glow -->
      <filter id="fb-figure" x="0" y="0" width="100%" height="100%">
        <feColorMatrix type="matrix" result="tint"
          values="0.95 0.03 0.05 0 0
                  0.02 0.88 0.05 0 0
                  0.05 0.03 1.02 0 0.02
                  0    0    0    1 0"/>
        <feComponentTransfer in="tint">
          <feFuncR type="linear" slope="1.15" intercept="-0.04"/>
          <feFuncG type="linear" slope="1.15" intercept="-0.04"/>
          <feFuncB type="linear" slope="1.15" intercept="-0.04"/>
        </feComponentTransfer>
      </filter>
      <linearGradient id="fb-feetfog" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a2458" stop-opacity="0"/>
        <stop offset=".45" stop-color="#4a3070" stop-opacity=".55"/>
        <stop offset="1" stop-color="#1a0e28" stop-opacity=".9"/>
      </linearGradient>
    </defs>

    <g clip-path="url(#cf-arch)">
      <!-- contact shadow so he's standing on the ground -->
      <ellipse cx="250" cy="${floor}" rx="${70 * scale}" ry="${9 * scale}" fill="#000" opacity=".75" filter="url(#fb-blur4)"/>

      <image class="card-figure" href="${card.figure}" x="${x}" y="${y}" width="${w}" height="${h}"
             preserveAspectRatio="${card.figureFill ? "xMidYMid slice" : "xMidYMax meet"}"
             filter="url(#fb-figure)"/>

      <!-- ground fog rolling in front of his feet -->
      <rect x="40" y="${floor - 34}" width="420" height="${392 - floor + 34}" fill="url(#fb-feetfog)"/>
    </g>`;
  };

  const spine = (id, x) =>
    Array.from({ length: 24 }, (_, i) => `<use href="#${id}" x="${x}" y="${112 + i * 20}"/>`).join("");

  const crossed = (id, x, y) =>
    `<use href="#${id}" transform="translate(${x} ${y}) rotate(45)"/>` +
    `<use href="#${id}" transform="translate(${x} ${y}) rotate(-45)"/>`;

  // =====================================================================
  // STYLE A: illustrated
  // =====================================================================
  function frontA(card) {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="#07050a"/>
      ${artImage(card)}
      <path d="${ARCH}" fill="url(#cf-art-vignette)"/>
      <path d="M26 392 V156 Q26 88 250 50 Q474 88 474 156 V392" fill="none" stroke="#3b2752" stroke-width="1.2"/>
      <path d="${ARCH}" fill="none" stroke="url(#cf-iron)" stroke-width="10"/>
      <path d="${ARCH}" fill="none" stroke="#8a4dd6" stroke-width="1.5" opacity=".8"/>

      <path d="${OUTER}" fill="url(#cf-iron)" fill-rule="evenodd"/>
      <rect x="16" y="16" width="468" height="668" rx="14" fill="none" stroke="#5b3f7a" stroke-width="1.5"/>
      ${spine("cf-vertebra", 8)}${spine("cf-vertebra", 492)}
      ${crossed("cf-bone-piece", 460, 40)}${crossed("cf-bone-piece", 40, 660)}

      <path d="${WINGS}" fill="none" stroke="url(#cf-bone)" stroke-width="4" stroke-linecap="round"/>
      <path d="${HORNS}" fill="#1a1222" stroke="#5b3f7a" stroke-width="1"/>
      <use href="#cf-skull" x="250" y="36"/>

      <path d="${PLATE}" fill="url(#cf-plate)" stroke="#000" stroke-width="2"/>
      <path d="${PLATE_IN}" fill="none" stroke="#8a4dd6" stroke-width="1" opacity=".7"/>
      <path class="cf-gem" d="M26 414 l8 -8 8 8 -8 8 z M458 414 l8 -8 8 8 -8 8 z" fill="url(#cf-gem)"/>

      <rect x="48" y="476" width="404" height="148" rx="6" fill="url(#cf-textbox)" stroke="#5b3f7a" stroke-width="1.5"/>
      <path d="${BRACKETS}" fill="none" stroke="url(#cf-bone)" stroke-width="3" stroke-linecap="round"/>

      <circle cx="66" cy="66" r="36" fill="url(#cf-iron)" stroke="url(#cf-bone)" stroke-width="3"/>
      <circle cx="66" cy="66" r="30" fill="#140c1e" stroke="#8a4dd6" stroke-width="1"/>
      ${card.cost == null
        ? `<path transform="translate(36 36)" d="${CRESCENT_SMALL}" fill="#8a4dd6" filter="url(#fx-cglow)"/>`
        : ""}

      ${card.health != null ? `
        <path d="${HEART}" fill="url(#cf-gem-radial)" stroke="url(#cf-bone)" stroke-width="3.5"/>
        <path d="M440 632 L436 646 L444 654 L438 670" fill="none" stroke="#1a0f24" stroke-width="1.4"/>` : ""}

      <path class="cf-gem" d="M250 660 l12 14 -12 14 -12 -14 z" fill="url(#cf-gem)" stroke="#000" stroke-width="1"/>
    </svg>`;
  }

  function backA() {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="url(#cb-bg)"/>
      <rect x="16" y="16" width="468" height="668" rx="14" fill="url(#cb-lattice)"/>
      <path d="${OUTER}" fill="url(#cf-iron)" fill-rule="evenodd"/>
      <rect x="16" y="16" width="468" height="668" rx="14" fill="none" stroke="#5b3f7a" stroke-width="1.5"/>
      <rect x="40" y="40" width="420" height="620" rx="10" fill="none" stroke="#8a4dd6" stroke-width="1" opacity=".5"/>
      ${spine("cf-vertebra", 8)}${spine("cf-vertebra", 492)}
      ${crossed("cf-bone-piece", 40, 40)}${crossed("cf-bone-piece", 460, 40)}
      ${crossed("cf-bone-piece", 40, 660)}${crossed("cf-bone-piece", 460, 660)}
      <path d="${CRESCENT_BIG}" fill="#4a2272" filter="url(#fx-cglow)"/>
      <use href="#cf-skull" transform="translate(272 336) scale(3)"/>
      <text x="250" y="560" text-anchor="middle" font-family="Grenze Gotisch, serif" font-weight="800"
            font-size="46" letter-spacing="2" fill="#b58bdc">Duskmoor</text>
    </svg>`;
  }

  // =====================================================================
  // STYLE B: painted pewter & enamel
  // =====================================================================
  // engraved thorn vine for the upper-left corner (mirrored for the right)
  const VINE =
    "M34 170 C34 112 84 76 158 58 " +
    "M70 104 C62 90 70 78 82 80 C90 82 88 92 80 92 " +
    "M120 76 C116 62 128 54 138 58 C146 62 142 72 134 70 " +
    "M50 128 l-7 -3 M60 110 l-6 -6 M92 86 l-3 -7 M140 64 l-2 -7";

  const filigreeB = () => `
    <g fill="none" stroke-linecap="round">
      <path d="${VINE}" stroke="#000" stroke-width="2.4" opacity=".7" transform="translate(0 1)"/>
      <path d="${VINE}" stroke="#8f76b8" stroke-width="1.2" opacity=".8"/>
      <g transform="translate(500 0) scale(-1 1)">
        <path d="${VINE}" stroke="#000" stroke-width="2.4" opacity=".7" transform="translate(0 1)"/>
        <path d="${VINE}" stroke="#8f76b8" stroke-width="1.2" opacity=".8"/>
      </g>
    </g>`;

  const heartFacetsB = `
    <g clip-path="url(#fb-heart-clip)">
      <path d="M440 632 L402 640 L421 620 Z" fill="#fff" opacity=".28"/>
      <path d="M440 632 L478 640 L459 620 Z" fill="#fff" opacity=".12"/>
      <path d="M440 632 L402 640 L440 686 Z" fill="#000" opacity=".22"/>
      <path d="M440 632 L478 640 L440 686 Z" fill="#000" opacity=".08"/>
    </g>`;

  // Duskmoor seal: silver-rimmed crescent cradling a small skull, with a few stars
  const star = (x, y, s) =>
    `<path d="M${x} ${y - s} L${x + s * 0.25} ${y - s * 0.25} L${x + s} ${y} L${x + s * 0.25} ${y + s * 0.25} L${x} ${y + s} L${x - s * 0.25} ${y + s * 0.25} L${x - s} ${y} L${x - s * 0.25} ${y - s * 0.25} Z"/>`;

  const SIGIL_B = `
    <defs>
      <mask id="fb-moon-mask" maskUnits="userSpaceOnUse" x="30" y="30" width="72" height="72">
        <circle cx="62" cy="67" r="21" fill="#fff"/>
        <circle cx="71" cy="61" r="17.5" fill="#000"/>
      </mask>
    </defs>

    <!-- violet glow in the shape of the crescent -->
    <g filter="url(#fb-blur4)" opacity=".6">
      <circle cx="62" cy="67" r="21" fill="#9b5ce6" mask="url(#fb-moon-mask)"/>
    </g>

    <!-- crescent body -->
    <circle cx="62" cy="67" r="21" fill="url(#fb-crescent)" mask="url(#fb-moon-mask)"/>

    <!-- silver rim on the outer and inner edges -->
    <g fill="none" stroke="#efe6fb" stroke-width="1.8" mask="url(#fb-moon-mask)">
      <circle cx="62" cy="67" r="21"/>
      <circle cx="71" cy="61" r="17.5"/>
    </g>

    <!-- skull resting in the moon's curve -->
    <use href="#fb-skull" transform="translate(72 64) scale(.36)"/>

    <!-- stars -->
    <g fill="#e6d4ff" class="cf-gem">
      ${star(82, 47, 2.6)}
      ${star(88, 62, 1.6)}
      ${star(78, 82, 1.8)}
    </g>`;

  function frontB(card) {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="#07050a"/>

      <!-- inset metal panel around the art -->
      <path d="${INNER} ${ARCH}" fill="url(#fb-panel)" fill-rule="evenodd" filter="url(#fb-metalfx)"/>
      ${filigreeB()}

      <!-- art with a soft inner shadow -->
      ${artImage(card)}
      ${card.figure ? figureImage(card) : ""}
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
        ${spine("fb-vertebra", 8)}${spine("fb-vertebra", 492)}
        ${crossed("fb-bone-piece", 460, 40)}${crossed("fb-bone-piece", 40, 660)}
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

      <!-- seal -->
      <circle cx="66" cy="66" r="36" fill="url(#fb-metal)" filter="url(#fb-metalfx)"/>
      <circle cx="66" cy="66" r="29" fill="url(#fb-enamel)"/>
      <circle cx="66" cy="66" r="32.5" fill="none" stroke="#c9b6e6" stroke-width="1.2" stroke-dasharray="1.5 4" opacity=".6"/>
      ${card.cost == null ? SIGIL_B : ""}

      <!-- faceted crystal heart -->
      ${card.health != null ? `
        <ellipse cx="440" cy="650" rx="44" ry="40" fill="#8a4dd6" opacity=".35" filter="url(#fb-blur4)"/>
        <path d="${HEART}" fill="url(#cf-gem-radial)"/>
        ${heartFacetsB}
        <path d="M440 632 L436 646 L444 654 L438 670" fill="none" stroke="#1a0f24" stroke-width="1.2"/>
        <ellipse cx="424" cy="632" rx="7" ry="3" transform="rotate(-30 424 632)" fill="#fff" opacity=".6" filter="url(#fb-glow)"/>
        <path d="${HEART}" fill="none" stroke="url(#fb-bone)" stroke-width="4" filter="url(#fb-bonefx)"/>` : ""}

      <use href="#fb-gem" transform="translate(250 674) scale(1.4)"/>
    </svg>`;
  }

  function backB() {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="url(#cb-bg)"/>
      <rect x="16" y="16" width="468" height="668" rx="14" fill="url(#cb-lattice)"/>
      <path d="${OUTER}" fill="url(#fb-metal)" fill-rule="evenodd" filter="url(#fb-metalfx)"/>
      <rect x="21" y="21" width="458" height="658" rx="11" fill="none" stroke="#7d5fb0" stroke-width=".8" opacity=".55"/>
      <rect x="40" y="40" width="420" height="620" rx="10" fill="none" stroke="url(#fb-metal)" stroke-width="4" filter="url(#fb-metalfx)"/>
      <g filter="url(#fb-bonefx)">
        ${spine("fb-vertebra", 8)}${spine("fb-vertebra", 492)}
        ${crossed("fb-bone-piece", 40, 40)}${crossed("fb-bone-piece", 460, 40)}
        ${crossed("fb-bone-piece", 40, 660)}${crossed("fb-bone-piece", 460, 660)}
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
  // STYLE C: realistic iron, bone & leather
  // =====================================================================
  const HORNS_C =
    "M226 22 C212 10 190 6 172 14 C164 18 162 28 170 32 C176 34 180 28 176 24 C186 20 198 22 208 30 C214 34 220 36 226 36 Z " +
    "M274 22 C288 10 310 6 328 14 C336 18 338 28 330 32 C324 34 320 28 324 24 C314 20 302 22 292 30 C286 34 280 36 274 36 Z";
  const HORN_RIDGES =
    "M214 14 Q210 20 214 28 M200 10 Q196 17 200 25 M186 10 Q182 16 186 23 " +
    "M286 14 Q290 20 286 28 M300 10 Q304 17 300 25 M314 10 Q318 16 314 23";
  const RIBS_C =
    "M224 44 Q180 34 128 54 M226 52 Q186 48 146 66 M228 60 Q196 60 166 78 " +
    "M276 44 Q320 34 372 54 M274 52 Q314 48 354 66 M272 60 Q304 60 334 78";
  const PLAQUE = "M46 390 H454 L462 398 V430 L454 438 H46 L38 430 V398 Z";

  const sealRivets = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return `<circle cx="${(66 + Math.cos(a) * 32).toFixed(1)}" cy="${(66 + Math.sin(a) * 32).toFixed(1)}" r="2.4"/>`;
  }).join("");

  const heartFacetsC = `
    <g clip-path="url(#fb-heart-clip)">
      <g fill="#fff" opacity=".18">
        <path d="M440 645 L410 624 L421 620 Z"/>
        <path d="M440 645 L440 632 L432 623 Z"/>
        <path d="M440 645 L459 620 L470 624 Z"/>
        <path d="M440 645 L402 640 L410 660 Z"/>
        <path d="M440 645 L456 674 L440 686 Z"/>
      </g>
      <g fill="#000" opacity=".28">
        <path d="M440 645 L421 620 L432 623 Z"/>
        <path d="M440 645 L448 623 L459 620 Z"/>
        <path d="M440 645 L478 640 L470 660 Z"/>
        <path d="M440 645 L424 674 L440 686 Z"/>
        <path d="M440 645 L470 660 L456 674 Z"/>
      </g>
      <path d="M440 645 L402 640 M440 645 L410 624 M440 645 L421 620 M440 645 L432 623 M440 645 L448 623 M440 645 L459 620 M440 645 L470 624 M440 645 L478 640 M440 645 L470 660 M440 645 L456 674 M440 645 L424 674 M440 645 L410 660"
            stroke="#e2c8ff" stroke-width=".5" opacity=".25"/>
    </g>`;

  function frontC(card) {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="#050407"/>

      <!-- inset iron panel around the art -->
      <path d="${INNER} ${ARCH}" fill="#1b1720" fill-rule="evenodd" filter="url(#fc-iron)"/>

      <!-- art with a deep inner shadow and heavy iron bezel -->
      ${artImage(card)}
      <path d="${ARCH}" fill="url(#cf-art-vignette)"/>
      <g clip-path="url(#cf-arch)">
        <path d="${ARCH}" fill="none" stroke="#000" stroke-width="30" filter="url(#fb-blur4)"/>
      </g>
      <path d="${ARCH}" fill="none" stroke="#000" stroke-width="16"/>
      <path d="${ARCH}" fill="none" stroke="#2a2430" stroke-width="13" filter="url(#fc-iron)"/>

      <!-- iron frame -->
      <path d="${OUTER}" fill="#2a2430" fill-rule="evenodd" filter="url(#fc-iron)"/>

      <!-- vertebra columns -->
      <g filter="url(#fc-bone)">${spine("fc-vertebra", 9)}${spine("fc-vertebra", 491)}</g>

      <!-- riveted corner brackets -->
      <use href="#fc-bracket" transform="translate(500 0) scale(-1 1)"/>
      <use href="#fc-bracket" transform="translate(0 700) scale(1 -1)"/>

      <!-- name plaque -->
      <path d="${PLAQUE}" fill="#2a2430" filter="url(#fc-iron)"/>
      <rect x="54" y="396" width="392" height="36" fill="#0f0c12"/>
      <g clip-path="url(#fc-plaque-clip)">
        <rect x="54" y="396" width="392" height="36" fill="none" stroke="#000" stroke-width="8" filter="url(#fb-blur4)"/>
      </g>
      <g fill="#3a3340" filter="url(#fc-iron)">
        <circle cx="45" cy="404" r="3"/><circle cx="45" cy="424" r="3"/>
        <circle cx="455" cy="404" r="3"/><circle cx="455" cy="424" r="3"/>
      </g>

      <!-- stitched leather text panel -->
      <rect x="48" y="476" width="404" height="148" rx="4" fill="#fff" filter="url(#fc-leather)"/>
      <g clip-path="url(#fb-tb-clip)">
        <rect x="48" y="476" width="404" height="148" rx="4" fill="none" stroke="#000" stroke-width="12" opacity=".75" filter="url(#fb-blur4)"/>
      </g>
      <rect x="56" y="484" width="388" height="132" rx="3" fill="none" stroke="#8a7a96" stroke-width="1.2" stroke-dasharray="5 3.5" opacity=".75"/>
      <rect x="48" y="476" width="404" height="148" rx="4" fill="none" stroke="#2a2430" stroke-width="4" filter="url(#fc-iron)"/>

      <!-- grime settled into the frame -->
      <rect width="500" height="700" filter="url(#fc-grime)" mask="url(#fc-no-art)" style="mix-blend-mode:multiply"/>

      <!-- ribs, horns and the weathered skull crest -->
      <path d="${RIBS_C}" fill="none" stroke="url(#fc-bone-grad)" stroke-width="5.5" stroke-linecap="round" filter="url(#fc-bone)"/>
      <path d="${HORNS_C}" fill="url(#fc-horn)" filter="url(#fc-bone)"/>
      <path d="${HORN_RIDGES}" fill="none" stroke="#000" stroke-width=".8" opacity=".45"/>
      <use href="#fc-skull" x="250" y="40"/>

      <!-- iron medallion seal -->
      <circle cx="66" cy="66" r="37" fill="#2a2430" filter="url(#fc-iron)"/>
      <circle cx="66" cy="66" r="27" fill="#0d0a10"/>
      <circle cx="66" cy="66" r="27" fill="none" stroke="#000" stroke-width="5" opacity=".8" filter="url(#fb-blur4)"/>
      <g fill="#3a3340" filter="url(#fc-iron)">${sealRivets}</g>
      ${card.cost == null ? `
        <path transform="translate(36 36)" d="${CRESCENT_SMALL}" fill="url(#fc-amethyst)"/>
        <path transform="translate(36 36)" d="${CRESCENT_SMALL}" fill="none" stroke="#e8d4ff" stroke-width=".6" opacity=".5"/>` : ""}

      <!-- amethyst heart in an iron bezel -->
      ${card.health != null ? `
        <path d="${HEART}" fill="none" stroke="#2a2430" stroke-width="7" filter="url(#fc-iron)"/>
        <path d="${HEART}" fill="url(#fc-amethyst-r)"/>
        ${heartFacetsC}
        <path d="M424 624 L425.2 629 L430 630 L425.2 631 L424 636 L422.8 631 L418 630 L422.8 629 Z" fill="#fff" opacity=".9"/>` : ""}

      <use href="#fc-gem" transform="translate(250 674) scale(1.3)"/>
    </svg>`;
  }

  function backC() {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="#050407"/>
      <rect x="16" y="16" width="468" height="668" rx="14" fill="#fff" filter="url(#fc-leather)"/>
      <rect x="36" y="36" width="428" height="628" rx="8" fill="none" stroke="#8a7a96" stroke-width="1.4" stroke-dasharray="6 4" opacity=".7"/>
      <path d="${OUTER}" fill="#2a2430" fill-rule="evenodd" filter="url(#fc-iron)"/>
      <g filter="url(#fc-bone)">${spine("fc-vertebra", 9)}${spine("fc-vertebra", 491)}</g>
      <use href="#fc-bracket"/>
      <use href="#fc-bracket" transform="translate(500 0) scale(-1 1)"/>
      <use href="#fc-bracket" transform="translate(0 700) scale(1 -1)"/>
      <use href="#fc-bracket" transform="translate(500 700) scale(-1 -1)"/>
      <rect width="500" height="700" filter="url(#fc-grime)" style="mix-blend-mode:multiply"/>

      <path d="${CRESCENT_BIG}" fill="url(#fc-amethyst)"/>
      <path d="${CRESCENT_BIG}" fill="none" stroke="#2a2430" stroke-width="8" filter="url(#fc-iron)"/>
      <use href="#fc-skull" transform="translate(272 336) scale(2.4)"/>

      <text x="250" y="562" text-anchor="middle" font-family="Grenze Gotisch, serif" font-weight="600"
            font-size="44" letter-spacing="3" fill="#000" opacity=".8">Duskmoor</text>
      <text x="250" y="560" text-anchor="middle" font-family="Grenze Gotisch, serif" font-weight="600"
            font-size="44" letter-spacing="3" fill="#a99f8e">Duskmoor</text>
    </svg>`;
  }

  const FRAMES = {
    a: { front: frontA, back: backA },
    b: { front: frontB, back: backB },
    c: { front: frontC, back: backC },
  };

  // =====================================================================
  // Card HTML
  // =====================================================================
  const abilityHTML = (a) =>
    `<p><span class="ability-name">${a.name}</span>` +
    (a.cost != null ? `<span class="soul-cost" aria-label="${a.cost} Souls">${a.cost}</span>` : "") +
    `${a.text}</p>`;

  function cardHTML(card, large = false) {
    const frame = FRAMES[card.frame] || FRAMES.a;
    const label = large
      ? `${card.name}. Select to flip.`
      : `${card.name}, ${card.typeLine}. Select to inspect.`;

    return `
    <article class="card" data-id="${card.id}" data-kingdom="${card.kingdom}" data-frame="${card.frame || "a"}"
             tabindex="0" role="button" aria-label="${label}">
      <div class="card-inner">
        <div class="card-face card-front">
          ${frame.front(card)}
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
        <div class="card-face card-back">${frame.back()}</div>
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
  grid.innerHTML = CARDS.map((c) => `
    <figure class="card-slot">
      ${cardHTML(c)}
      ${c.styleLabel ? `<figcaption class="card-caption">${c.styleLabel}</figcaption>` : ""}
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
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

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