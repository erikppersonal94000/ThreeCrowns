(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // =====================================================================
  // Card data
  // Add new cards here; the page builds itself from this list.
  // Heroes: type "hero". Attack cards: type "attack" + rarity
  // ("common" | "uncommon" | "rare" | "legendary").
  // Optional: art, artAlign ("xMidYMin" | "xMidYMid" | "xMidYMax"),
  //           cost, attack, abilities, flavor, typeLine.
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

      // Duskmoor attack cards. Health, attack, effects and descriptions to come.
    {
      id: "skeleton",
      type: "attack",
      kingdom: "dark",
      rarity: "common",
      name: "Skeleton",
      art: "graphics/cards/skeleton.jpg",
      artZoom: 1.2,      // 1.1 = a little closer, 1.3 = a lot closer
      artShiftY: 1,      // positive moves the picture down, negative moves it up
      label: "Common",
    },
    {
      id: "wight",
      type: "attack",
      kingdom: "dark",
      rarity: "uncommon",
      name: "Wight",
      art: "graphics/cards/wight.jpg",
      artZoom: 1.1,      // 1.1 = a little closer, 1.3 = a lot closer
      artShiftY: 1,      // positive moves the picture down, negative moves it up
      label: "Uncommon",
    },
    {
      id: "raised-werewolf",
      type: "attack",
      kingdom: "dark",
      rarity: "rare",
      name: "Raised Werewolf",
      art: "graphics/cards/raised-werewolf.jpg",
      artZoom: 1.2,      // 1.1 = a little closer, 1.3 = a lot closer
      artShiftY: 0,      // positive moves the picture down, negative moves it up
      label: "Rare",
    },
    {
      id: "alfarr-the-seer",
      type: "attack",
      kingdom: "dark",
      rarity: "legendary",
      name: "Alfarr the Seer",
      art: "graphics/cards/alfarr-the-seer.svg",
      label: "Legendary",
    },
  ];

  // =====================================================================
  // Shared layout (every card is 500 x 700)
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

  const vines = (color, width) => `
    <g fill="none" stroke-linecap="round">
      <path d="${VINE}" stroke="#000" stroke-width="${width + 1.2}" opacity=".7" transform="translate(0 1)"/>
      <path d="${VINE}" stroke="${color}" stroke-width="${width}" opacity=".9"/>
      <g transform="translate(500 0) scale(-1 1)">
        <path d="${VINE}" stroke="#000" stroke-width="${width + 1.2}" opacity=".7" transform="translate(0 1)"/>
        <path d="${VINE}" stroke="${color}" stroke-width="${width}" opacity=".9"/>
      </g>
    </g>`;

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

  // =====================================================================
  // HERO card front (Morvane)
  // =====================================================================
  const HEART_FACETS = `
    <g clip-path="url(#fb-heart-clip)">
      <path d="M440 632 L402 640 L421 620 Z" fill="#fff" opacity=".28"/>
      <path d="M440 632 L478 640 L459 620 Z" fill="#fff" opacity=".12"/>
      <path d="M440 632 L402 640 L440 686 Z" fill="#000" opacity=".22"/>
      <path d="M440 632 L478 640 L440 686 Z" fill="#000" opacity=".08"/>
    </g>`;

  const star = (x, y, s) =>
    `<path d="M${x} ${y - s} L${x + s * 0.25} ${y - s * 0.25} L${x + s} ${y} L${x + s * 0.25} ${y + s * 0.25} L${x} ${y + s} L${x - s * 0.25} ${y + s * 0.25} L${x - s} ${y} L${x - s * 0.25} ${y - s * 0.25} Z"/>`;

  // Duskmoor seal: silver-rimmed crescent cradling a small skull, with a few stars
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

  function frontSVG(card) {
    return `
    <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
      <rect width="500" height="700" rx="24" fill="#07050a"/>

      <path d="${INNER} ${ARCH}" fill="url(#fb-panel)" fill-rule="evenodd" filter="url(#fb-metalfx)"/>
      ${vines("#8f76b8", 1.2)}

      ${artImage(card)}
      <path d="${ARCH}" fill="url(#cf-art-vignette)"/>
      <g clip-path="url(#cf-arch)">
        <path d="${ARCH}" fill="none" stroke="#000" stroke-width="22" opacity=".85" filter="url(#fb-blur4)"/>
      </g>
      <path d="${ARCH}" fill="none" stroke="url(#fb-metal)" stroke-width="12" filter="url(#fb-metalfx)"/>
      <path d="${ARCH}" fill="none" stroke="#b27bff" stroke-width="1.4" opacity=".9" filter="url(#fb-glow)"/>

      <path d="${OUTER}" fill="url(#fb-metal)" fill-rule="evenodd" filter="url(#fb-metalfx)"/>
      <rect x="21" y="21" width="458" height="658" rx="11" fill="none" stroke="#7d5fb0" stroke-width=".8" opacity=".55"/>

      <g filter="url(#fb-bonefx)">
        ${crossed(460, 40)}${crossed(40, 660)}
      </g>
      <use href="#fb-skull" transform="translate(460 40) scale(.55)"/>
      <use href="#fb-skull" transform="translate(40 660) scale(.55)"/>

      <path d="${WINGS}" fill="none" stroke="#1a1222" stroke-width="6" stroke-linecap="round" transform="translate(0 1.5)"/>
      <path d="${WINGS}" fill="none" stroke="url(#fb-bone)" stroke-width="4" stroke-linecap="round" filter="url(#fb-bonefx)"/>
      <path d="${HORNS}" fill="url(#fb-horn)" filter="url(#fb-metalfx)"/>
      <path d="M226 20 Q224 14 220 10 M230 18 Q226 12 222 8 M274 20 Q276 14 280 10 M270 18 Q274 12 278 8"
            fill="none" stroke="#000" stroke-width=".7" opacity=".6"/>
      <use href="#fb-skull" x="250" y="36"/>

      <path d="${PLATE}" fill="url(#fb-metal-h)" filter="url(#fb-metalfx)"/>
      <path d="${PLATE_IN}" fill="url(#fb-enamel)"/>
      <path d="${PLATE_IN}" fill="none" stroke="#c49cff" stroke-width=".8" opacity=".6"/>
      <use href="#fb-gem" transform="translate(34 414)"/>
      <use href="#fb-gem" transform="translate(466 414)"/>

      <rect x="48" y="476" width="404" height="148" rx="6" fill="url(#fb-inset)" filter="url(#fb-canvasfx)"/>
      <g clip-path="url(#fb-tb-clip)">
        <rect x="48" y="476" width="404" height="148" rx="6" fill="none" stroke="#000" stroke-width="14" opacity=".8" filter="url(#fb-blur4)"/>
      </g>
      <rect x="48" y="476" width="404" height="148" rx="6" fill="none" stroke="url(#fb-metal)" stroke-width="3" filter="url(#fb-metalfx)"/>
      <path d="${BRACKETS}" fill="none" stroke="url(#fb-bone)" stroke-width="3.2" stroke-linecap="round" filter="url(#fb-bonefx)"/>

      <circle cx="66" cy="66" r="36" fill="url(#fb-metal)" filter="url(#fb-metalfx)"/>
      <circle cx="66" cy="66" r="29" fill="url(#fb-enamel)"/>
      <circle cx="66" cy="66" r="32.5" fill="none" stroke="#c9b6e6" stroke-width="1.2" stroke-dasharray="1.5 4" opacity=".6"/>
      ${card.cost == null ? SIGIL : ""}

      ${card.health != null ? `
        <ellipse cx="440" cy="650" rx="44" ry="40" fill="#8a4dd6" opacity=".35" filter="url(#fb-blur4)"/>
        <path d="${HEART}" fill="url(#cf-gem-radial)"/>
        ${HEART_FACETS}
        <path d="M440 632 L436 646 L444 654 L438 670" fill="none" stroke="#1a0f24" stroke-width="1.2"/>
        <ellipse cx="424" cy="632" rx="7" ry="3" transform="rotate(-30 424 632)" fill="#fff" opacity=".6" filter="url(#fb-glow)"/>
        <path d="${HEART}" fill="none" stroke="url(#fb-bone)" stroke-width="4" filter="url(#fb-bonefx)"/>` : ""}

      <use href="#fb-gem" transform="translate(250 674) scale(1.4)"/>
    </svg>`;
  }

  // =====================================================================
  // ATTACK card fronts. One frame per rarity.
  // =====================================================================
  const GEM_COLORS = {
    common:    ["#b4aebb", "#77717f", "#3a3640"],  // dull stone
    uncommon:  ["#fffaf0", "#d8ccb4", "#8a7e68"],  // bone-white
    rare:      ["#e3c6ff", "#9b5ce6", "#2a0c4f"],  // violet
    legendary: ["#ffd9f7", "#d24fd0", "#4a0c52"],  // magenta
  };
  const GEM_COUNT = { common: 1, uncommon: 2, rare: 3, legendary: 4 };

  // Row of 1-4 gems at the bottom showing rarity
  const gemRow = (rarity) => {
    const n = GEM_COUNT[rarity];
    const gap = 24;
    const start = 250 - ((n - 1) * gap) / 2;
    const cls = rarity === "rare" || rarity === "legendary" ? "cf-gem" : "";
    return Array.from({ length: n }, (_, i) => facetGem(start + i * gap, 670, 0.95, GEM_COLORS[rarity], cls)).join("");
  };

  // Art (or an empty backdrop) inside a window shape, with vignette and inner shadow.
  // Optional on a card: artZoom (1 = normal, 1.2 = 20% closer),
  // artShiftX / artShiftY (move the picture in card pixels while zoomed).
  const artLayer = (card, win, [x, y, w, h], uid, emptyFill) => {
    const z = card.artZoom || 1;
    const zw = w * z;
    const zh = h * z;
    const zx = x - (zw - w) / 2 + (card.artShiftX || 0);
    const zy = y - (zh - h) / 2 + (card.artShiftY || 0);

    return `
    <clipPath id="${uid}-win"><path d="${win}"/></clipPath>
    ${card.art
      ? `<image href="${card.art}" x="${zx}" y="${zy}" width="${zw}" height="${zh}" preserveAspectRatio="${card.artAlign || "xMidYMid"} slice" clip-path="url(#${uid}-win)"/>`
      : `<path d="${win}" fill="${emptyFill}"/>`}
    <path d="${win}" fill="url(#cf-art-vignette)"/>
    <g clip-path="url(#${uid}-win)">
      <path d="${win}" fill="none" stroke="#000" stroke-width="22" opacity=".85" filter="url(#fb-blur4)"/>
    </g>`;
  };
  const plate = (shape, inner, fill, innerFill, rim, fx) => `
    <path d="${shape}" fill="${fill}" ${fx}/>
    <path d="${inner}" fill="${innerFill}"/>
    ${rim ? `<path d="${inner}" fill="none" stroke="${rim}" stroke-width=".9" opacity=".8"/>` : ""}`;

  const textPanel = (fill, rim, fx) => `
    <rect x="48" y="476" width="404" height="148" rx="6" fill="${fill}"/>
    <g clip-path="url(#fb-tb-clip)">
      <rect x="48" y="476" width="404" height="148" rx="6" fill="none" stroke="#000" stroke-width="14" opacity=".7" filter="url(#fb-blur4)"/>
    </g>
    <rect x="48" y="476" width="404" height="148" rx="6" fill="none" stroke="${rim}" stroke-width="3" ${fx}/>`;

  const seal = (fill, innerFill, fx, ring) => `
    <circle cx="66" cy="66" r="36" fill="${fill}" ${fx}/>
    <circle cx="66" cy="66" r="29" fill="${innerFill}"/>
    ${ring ? `<circle cx="66" cy="66" r="32.5" fill="none" stroke="${ring}" stroke-width="1.2" stroke-dasharray="1.5 4" opacity=".75"/>` : ""}`;

  // Attack emblem (bottom right), shaped like a blade
  const BLADE = "M440 610 L476 644 L440 692 L404 644 Z";
  const BLADE_IN = "M440 620 L466 644 L440 680 L414 644 Z";
  const blade = (fill, innerFill, line, fx, lineFx = "") => `
    <path d="${BLADE}" fill="${fill}" ${fx}/>
    <path d="${BLADE_IN}" fill="${innerFill}"/>
    <path d="${BLADE_IN}" fill="none" stroke="${line}" stroke-width="1.6" ${lineFx}/>
    <path d="M422 632 H458" stroke="${line}" stroke-width="2" stroke-linecap="round" ${lineFx}/>`;

  // ---------------- COMMON: rough grey stone ----------------
  function commonFrame(card, uid) {
    const WIN = "M40 72 H460 V392 H40 Z";
    const OUT = "M10 0 H490 A10 10 0 0 1 500 10 V690 A10 10 0 0 1 490 700 H10 A10 10 0 0 1 0 690 V10 A10 10 0 0 1 10 0 Z";
    const IN_ = "M22 16 H478 A6 6 0 0 1 484 22 V678 A6 6 0 0 1 478 684 H22 A6 6 0 0 1 16 678 V22 A6 6 0 0 1 22 16 Z";
    const FX = 'filter="url(#st-stonefx)"';

    return `
      <rect width="500" height="700" rx="10" fill="#0c0b0e"/>
      <path d="${IN_} ${WIN}" fill="#4a4852" fill-rule="evenodd" ${FX}/>
      ${artLayer(card, WIN, [40, 72, 420, 320], uid, "url(#st-empty)")}
      <path d="${WIN}" fill="none" stroke="url(#st-stone)" stroke-width="8" ${FX}/>

      <path d="${OUT} ${IN_}" fill="url(#st-stone)" fill-rule="evenodd" ${FX}/>
      <!-- chips and cracks -->
      <path d="M0 210 L10 216 L4 224 M500 470 L490 476 L496 486 M180 0 L186 10 L194 4 M320 700 L326 690 L334 698 M0 540 L8 546"
            fill="none" stroke="#1a191d" stroke-width="1.4"/>

      ${plate("M42 388 H458 V440 H42 Z", "M50 395 H450 V433 H50 Z", "url(#st-stone)", "#141317", null, FX)}
      ${textPanel("#121115", "url(#st-stone)", FX)}
      ${seal("url(#st-stone)", "#141317", FX, null)}
      ${blade("url(#st-stone)", "#141317", "#5a5760", FX)}
      ${gemRow("common")}`;
  }

  // ---------------- UNCOMMON: bone ----------------
  function uncommonFrame(card, uid) {
    const WIN = "M40 392 V122 Q250 78 460 122 V392 Z";
    const OUT = "M30 0 H470 L500 30 V670 L470 700 H30 L0 670 V30 Z";
    const IN_ = "M36 16 H464 L484 36 V664 L464 684 H36 L16 664 V36 Z";
    const FX = 'filter="url(#bn-bonefx)"';

    // grooves that split the frame into stacked vertebra segments
    const sideGrooves = Array.from({ length: 26 }, (_, i) => {
      const y = 46 + i * 24;
      return `M0 ${y} H16 M484 ${y} H500`;
    }).join(" ");
    const topGrooves = Array.from({ length: 14 }, (_, i) => {
      const x = 62 + i * 28;
      return `M${x} 0 V16 M${x} 684 V700`;
    }).join(" ");

    return `
      <path d="${OUT}" fill="#0e0c0a"/>
      <path d="${IN_} ${WIN}" fill="#8a7f6a" fill-rule="evenodd" ${FX}/>
      ${artLayer(card, WIN, [40, 78, 420, 314], uid, "url(#ac-empty)")}
      <path d="${WIN}" fill="none" stroke="url(#bn-bone)" stroke-width="10" ${FX}/>

      <path d="${OUT} ${IN_}" fill="url(#bn-bone)" fill-rule="evenodd" ${FX}/>
      <path d="${sideGrooves} ${topGrooves}" fill="none" stroke="#6b604c" stroke-width="1.6" opacity=".85"/>

      <!-- knuckle-bone corners -->
      <g fill="url(#bn-bone)" ${FX}>
        <circle cx="14" cy="14" r="13"/><circle cx="486" cy="14" r="13"/>
        <circle cx="14" cy="686" r="13"/><circle cx="486" cy="686" r="13"/>
      </g>

      <use href="#fb-skull" transform="translate(250 34) scale(.7)"/>

      ${plate(PLATE, PLATE_IN, "url(#bn-bone)", "#1a1510", "#e9e0cf", FX)}
      ${textPanel("#15110c", "url(#bn-bone)", FX)}
      ${seal("url(#bn-bone)", "#1a1510", FX, "#e9e0cf")}
      ${blade("url(#bn-bone)", "#1a1510", "#d8ccb4", FX)}
      ${gemRow("uncommon")}`;
  }

  // ---------------- RARE: obsidian & amethyst ----------------
  const shard = (x, y, angle, len, w) => `
    <g transform="translate(${x} ${y}) rotate(${angle})">
      <path d="M${-w / 2} 0 L0 ${-len} L${w / 2} 0 L0 ${w * 0.35} Z" fill="url(#ob-amethyst)"/>
      <path d="M0 ${-len} L${w / 2} 0 L0 ${w * 0.35} Z" fill="#1a0630" opacity=".45"/>
      <path d="M${-w / 2} 0 L0 ${-len}" stroke="#fff" stroke-width=".8" opacity=".6"/>
    </g>`;

  const cluster = (x, y, a, s = 1) =>
    shard(x, y, a - 22, 30 * s, 12 * s) +
    shard(x, y, a + 20, 26 * s, 11 * s) +
    shard(x, y, a, 44 * s, 15 * s);

  function rareFrame(card, uid) {
    const FX = 'filter="url(#ob-glossfx)"';

    return `
      <rect width="500" height="700" rx="24" fill="#050407"/>
      <path d="${INNER} ${ARCH}" fill="#120e18" fill-rule="evenodd" ${FX}/>
      ${vines("#9b6fd6", 1.2)}
      ${artLayer(card, ARCH, [40, 60, 420, 332], uid, "url(#ac-empty)")}
      <path d="${ARCH}" fill="none" stroke="url(#ob-obsidian)" stroke-width="12" ${FX}/>
      <path d="${ARCH}" fill="none" stroke="#b27bff" stroke-width="1.4" opacity=".9" filter="url(#fb-glow)"/>

      <path d="${OUTER}" fill="url(#ob-obsidian)" fill-rule="evenodd" ${FX}/>
      <rect x="21" y="21" width="458" height="658" rx="11" fill="none" stroke="#b27bff" stroke-width=".9" opacity=".7"/>

      ${plate(PLATE, PLATE_IN, "url(#ob-obsidian)", "url(#fb-enamel)", "#c49cff", FX)}

      ${textPanel("url(#fb-inset)", "url(#ob-obsidian)", FX)}
      ${seal("url(#ob-obsidian)", "url(#fb-enamel)", FX, "#c49cff")}
      <ellipse cx="440" cy="650" rx="40" ry="44" fill="#8a4dd6" opacity=".3" filter="url(#fb-blur4)"/>
      ${blade("url(#ob-obsidian)", "url(#fb-enamel)", "url(#ob-amethyst)", FX, 'filter="url(#fb-glow)"')}
      ${gemRow("rare")}`;
  }

  // ---------------- LEGENDARY: blackened gold, full art ----------------
  // skeletal gold wing for the left side (mirrored for the right)
  const WING = `
    <path d="M8 120 L-38 50 Q-38 92 -54 122 Q-44 166 -46 206 Q-34 238 -30 272 L8 292 Z" fill="#1c0a26" opacity=".78"/>
    <path d="M8 120 Q-16 80 -38 50 M8 150 Q-26 130 -54 122 M8 200 Q-24 200 -46 206 M8 250 Q-14 262 -30 272"
          fill="none" stroke="url(#lg-gold)" stroke-width="4.5" stroke-linecap="round" filter="url(#fb-metalfx)"/>
    <g fill="url(#lg-gold)">
      <path d="M-38 50 l-3 -9 l7 5 z"/>
      <path d="M-54 122 l-9 -2 l7 -5 z"/>
      <path d="M-46 206 l-9 1 l6 -6 z"/>
      <path d="M-30 272 l-7 5 l2 -8 z"/>
    </g>`;

  function legendaryFrame(card, uid) {
    const FX = 'filter="url(#fb-metalfx)"';
    const GLASS = "rgba(8, 5, 14, .66)";

        return `
      <rect width="500" height="700" rx="24" fill="#050308"/>

      <!-- full art: the painting fills the whole card -->
      ${artLayer(card, INNER, [16, 16, 468, 668], uid, "url(#lg-art)")}
      ${vines("url(#lg-gold)", 1.8)}

      <path d="${OUTER}" fill="url(#lg-gold)" fill-rule="evenodd" ${FX}/>
      <rect x="21" y="21" width="458" height="658" rx="11" fill="none" stroke="url(#lg-gold)" stroke-width="1.4" opacity=".9"/>

      <!-- horned skull wearing a gold crown -->
      <path d="M226 16 C204 6 194 -12 202 -28 C206 -12 216 -2 232 4 Z M274 16 C296 6 306 -12 298 -28 C294 -12 284 -2 268 4 Z"
            fill="url(#lg-gold)" ${FX}/>
      <use href="#fb-skull" transform="translate(250 30) scale(1.2)"/>
      <path d="M226 8 L232 -18 L240 -2 L250 -30 L260 -2 L268 -18 L274 8 Z" fill="url(#lg-gold)" ${FX}/>
      ${facetGem(250, -12, 0.7, GEM_COLORS.legendary, "cf-gem")}

      <!-- glass panels over the art -->
      ${plate(PLATE, PLATE_IN, GLASS, "rgba(20, 8, 30, .5)", "url(#lg-gold)", "")}
      <path d="${PLATE}" fill="none" stroke="url(#lg-gold)" stroke-width="2.5" ${FX}/>
      ${textPanel(GLASS, "url(#lg-gold)", FX)}
      ${seal("url(#lg-gold)", GLASS, FX, "#e8c878")}
      <ellipse cx="440" cy="650" rx="40" ry="44" fill="#d24fd0" opacity=".35" filter="url(#fb-blur4)"/>
      ${blade("url(#lg-gold)", GLASS, "url(#lg-gold)", FX)}

      <ellipse cx="250" cy="672" rx="60" ry="16" fill="#d24fd0" opacity=".45" filter="url(#fb-blur4)"/>
      ${gemRow("legendary")}`;
  }

  // Animated shadow-flames and drifting wisps, drawn on their own layer
  // so the detailed frame underneath doesn't have to redraw every frame
  function legendaryFX() {
    const wisps = [

      [8, 600, 0], [492, 520, 2.5], [8, 380, 5], [492, 260, 1.2], [140, 64, 3.6], [360, 64, 6],
    ].map(([x, y, d]) =>
      `<circle class="lg-wisp" cx="${x}" cy="${y}" r="3" fill="#e0a8ff" filter="url(#fb-glow)" style="animation-delay:-${d}s"/>`
    ).join("");

    return `
    <svg class="card-fx" viewBox="0 0 500 700" aria-hidden="true">
      ${wisps}
    </svg>`;
  }

  const ATTACK_FRAMES = {
    common: commonFrame,
    uncommon: uncommonFrame,
    rare: rareFrame,
    legendary: legendaryFrame,
  };

  function attackFrontSVG(card) {
    const rarity = ATTACK_FRAMES[card.rarity] ? card.rarity : "common";
    const uid = `ac-${card.id}`;
    return `
      <svg class="card-svg" viewBox="0 0 500 700" aria-hidden="true">
        ${ATTACK_FRAMES[rarity](card, uid)}
      </svg>
      ${rarity === "legendary" ? legendaryFX() : ""}`;
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
  // Screen hooks
  // =====================================================================
  const motes = Motes(document.getElementById("card-motes"));

  Screens.register("cards", {
    // no music setting: keeps whatever Duskmoor is playing

    enter() {
      motes.start();
      // load every card picture so they're there when the smoke lifts
      return Promise.all(CARDS.filter((c) => c.art).map((c) => {
        const img = new Image();
        img.src = c.art;
        return img.decode().catch(() => {});
      }));
    },

    exit() {
      motes.stop();
      if (dialog.open) dialog.close();
    },
  });
})();