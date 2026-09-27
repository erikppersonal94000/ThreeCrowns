(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // =====================================================================
  // Duskmoor heroes. Locked slots are placeholders for future heroes.
  // =====================================================================
  const HEROES = [
    {
      id: "morvane",
      name: "Morvane the Bone-Caller",
      shortName: "Morvane",
      title: "Hero of Duskmoor",
      art: "graphics/cards/necromancer-painted.svg",
      health: 30,
      abilities: [
        { name: "Grave Harvest", cost: 2, text: "Return a minion from your discard pile to your hand." },
        { name: "Deathless", text: "Whenever one of your minions dies, gain 1 Soul." },
      ],
      flavor: "Every grave is a door, and I hold every key.",
    },
    { id: "locked-1", locked: true },
    { id: "locked-2", locked: true },
  ];

  const HEART_ICON = `
    <svg viewBox="0 0 40 36" aria-hidden="true">
      <defs>
        <radialGradient id="heart-grad" cx=".4" cy=".35" r=".7">
          <stop offset="0" stop-color="#f0dcff"/>
          <stop offset=".4" stop-color="#9b5ce6"/>
          <stop offset="1" stop-color="#2d0f52"/>
        </radialGradient>
      </defs>
      <path d="M20 34 C8 25 2 18 2 11 C2 5 7 1 12 1 C16 1 19 4 20 7 C21 4 24 1 28 1 C33 1 38 5 38 11 C38 18 32 25 20 34 Z"
            fill="url(#heart-grad)" stroke="#e6e0ea" stroke-width="1.6"/>
    </svg>`;

  const LOCK_ICON = `
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#b58bdc" stroke-width="1.8" stroke-linecap="round">
      <rect x="5" y="11" width="14" height="10" rx="2"/>
      <path d="M8 11 V8 a4 4 0 0 1 8 0 V11"/>
    </svg>`;

  const portrait = document.getElementById("portrait");
  const portraitImg = document.getElementById("portrait-img");
  const info = document.getElementById("hero-info");
  const roster = document.getElementById("roster");

  let selectedId = HEROES[0].id;

  // =====================================================================
  // Hero details panel
  // =====================================================================
  function infoHTML(hero) {
    const abilities = hero.abilities.map((a) => `
      <li>
        <div class="ab-head">
          <span class="ab-name">${a.name}</span>
          ${a.cost != null ? `<span class="ab-cost" aria-label="${a.cost} Souls">${a.cost}</span>` : ""}
        </div>
        <p>${a.text}</p>
      </li>`).join("");

    return `
      <p class="hero-kicker">${hero.title}</p>
      <h2 class="hero-name">${hero.name}</h2>
      <div class="hero-stats">
        <span class="stat">${HEART_ICON}<strong>${hero.health}</strong> Health</span>
      </div>
      <ul class="abilities">${abilities}</ul>
      ${hero.flavor ? `<blockquote class="hero-flavor">${hero.flavor}</blockquote>` : ""}
      <button class="begin-btn" id="begin-btn">Begin as ${hero.shortName}</button>
      <p class="begin-note" id="begin-note" hidden>Battles are coming soon.</p>`;
  }

  function showHero(hero, animate) {
    const apply = () => {
      portraitImg.src = hero.art;
      portraitImg.alt = `${hero.name}, ${hero.title}`;
      info.innerHTML = infoHTML(hero);
      document.getElementById("begin-btn").addEventListener("click", () => {
        // Later: Screens.go("battle") once battles exist
        document.getElementById("begin-note").hidden = false;
      });
    };

    if (!animate || reduceMotion) { apply(); return; }

    // fade out, swap, fade back in
    portrait.classList.add("is-changing");
    info.classList.add("is-changing");
    setTimeout(() => {
      apply();
      portraitImg.onload = () => portrait.classList.remove("is-changing");
      info.classList.remove("is-changing");
    }, 300);
  }

  // =====================================================================
  // Roster
  // =====================================================================
  function renderRoster() {
    roster.innerHTML = HEROES.map((h) => h.locked
      ? `
        <button class="roster-hero is-locked" aria-disabled="true" aria-label="Locked hero">
          <span class="roster-thumb">${LOCK_ICON}</span>
          <span class="roster-name">Locked</span>
        </button>`
      : `
        <button class="roster-hero" data-id="${h.id}" aria-pressed="${h.id === selectedId}">
          <span class="roster-thumb"><img src="${h.art}" alt=""></span>
          <span class="roster-name">${h.shortName}</span>
        </button>`
    ).join("");

    roster.querySelectorAll(".roster-hero:not(.is-locked)").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.id === selectedId) return;
        selectedId = btn.dataset.id;
        roster.querySelectorAll(".roster-hero:not(.is-locked)").forEach((b) => {
          b.setAttribute("aria-pressed", b.dataset.id === selectedId);
        });
        showHero(HEROES.find((h) => h.id === selectedId), true);
      });
    });
  }

  renderRoster();
  showHero(HEROES[0], false);

  // =====================================================================
  // Screen hooks
  // =====================================================================
  const screen = document.getElementById("screen-duskmoor");
  const motes = Motes(document.getElementById("motes"));
  let readyTimer = 0;

  Screens.register("duskmoor", {
    // Change to "audio/duskmoor-theme.mp3" once you have the track
    music: null,

    enter() {
      // Reset, then bring everything in once the smoke has mostly cleared
      screen.classList.remove("is-ready");
      clearTimeout(readyTimer);
      readyTimer = setTimeout(() => screen.classList.add("is-ready"), reduceMotion ? 0 : 700);
      motes.start();
      // wait for the portrait so it's there when the smoke lifts
      return portraitImg.decode ? portraitImg.decode().catch(() => {}) : null;
    },

    exit() {
      motes.stop();
    },
  });
})();