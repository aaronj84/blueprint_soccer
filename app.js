/* The Blueprint / CFC Red — multi-pack tactical learning engine */
(function () {
  "use strict";

  const PACKS = {
    blueprint: window.SoccerIQ,
    cfcRed: window.CfcRedIQ,
    cfcFutsal: window.CfcFutsalIQ,
  };

  if (!PACKS.blueprint || !PACKS.blueprint.SCENARIOS) {
    document.getElementById("app-root").innerHTML =
      '<p class="empty-state">Failed to load scenario data. Check scenarios.js.</p>';
    return;
  }
  if (!PACKS.cfcRed || !PACKS.cfcRed.SCENARIOS) {
    console.warn("CFC Red pack missing — cfc-red-scenarios.js did not load.");
  }
  if (!PACKS.cfcFutsal || !PACKS.cfcFutsal.SCENARIOS) {
    console.warn("CFC Red Futsal pack missing — cfc-futsal-scenarios.js did not load.");
  }

  let packId = "blueprint";
  let CONFIG;
  let MODULES;
  let SCENARIOS;
  let GLOSSARY;
  let NAV_GROUPS;
  let PW;
  let PL;
  let drawScale = 1;
  let animGeneration = 0;

  function bindPack(id) {
    const pack = PACKS[id];
    if (!pack || !pack.SCENARIOS) return false;
    if (packId === id && CONFIG) return true;
    const switching = !!CONFIG;
    if (switching) {
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.progress));
      } catch {
        /* ignore */
      }
    }
    packId = id;
    CONFIG = pack.CONFIG;
    MODULES = pack.MODULES;
    SCENARIOS = pack.SCENARIOS;
    GLOSSARY = pack.GLOSSARY;
    NAV_GROUPS = pack.NAV_GROUPS || [];
    PW = CONFIG.pitch.width;
    PL = CONFIG.pitch.length;
    if (switching) {
      state.progress = loadProgress();
    }
    return true;
  }

  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Progress ---------- */
  function defaultProgress() {
    return {
      scenarios: {},
      challengeAttempts: [],
      lastModule: null,
      overviewDismissed: {},
    };
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return defaultProgress();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultProgress(), parsed, {
        scenarios: parsed.scenarios || {},
        overviewDismissed: parsed.overviewDismissed || {},
      });
    } catch {
      return defaultProgress();
    }
  }

  function saveProgress() {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.progress));
  }

  bindPack("blueprint");

  function getScenarioProgress(id) {
    return state.progress.scenarios[id] || {
      completed: false,
      decisionCorrect: false,
      rationaleCorrect: false,
      firstAttemptCorrect: null,
      attempts: 0,
      needsReview: false,
    };
  }

  function moduleScenarios(moduleId) {
    return SCENARIOS.filter((s) => s.module === moduleId);
  }

  function moduleStats(moduleId) {
    const list = moduleScenarios(moduleId).filter((s) => s.persistProgress !== false);
    const total = list.length;
    let completed = 0;
    let decisionHits = 0;
    let rationaleHits = 0;
    let rationaleTotal = 0;
    let firstHits = 0;
    let firstTotal = 0;

    list.forEach((s) => {
      const p = getScenarioProgress(s.id);
      if (p.completed) completed += 1;
      if (p.decisionCorrect) decisionHits += 1;
      if (s.rationaleOptions && s.rationaleOptions.length) {
        rationaleTotal += 1;
        if (p.rationaleCorrect) rationaleHits += 1;
      }
      if (p.firstAttemptCorrect !== null) {
        firstTotal += 1;
        if (p.firstAttemptCorrect) firstHits += 1;
      }
    });

    const masteryPct =
      total === 0 ? 0 : Math.round((decisionHits / total) * 100);
    return {
      total,
      completed,
      decisionHits,
      rationaleHits,
      rationaleTotal,
      firstHits,
      firstTotal,
      masteryPct,
      masteryLabel: masteryLabel(masteryPct),
    };
  }

  function masteryLabel(pct) {
    const m = CONFIG.mastery;
    if (pct >= m.ready) return "mastered";
    if (pct >= m.developing) return "ready";
    if (pct >= m.learning) return "developing";
    return "learning";
  }

  /* ---------- State ---------- */
  const state = {
    progress: loadProgress(),
    coach: new URLSearchParams(location.search).get("coach") === "1",
    view: "home",
    moduleId: null,
    scenarioId: null,
    session: null,
    challenge: null,
    drawerOpen: false,
  };

  if (state.coach) document.body.classList.add("coach-mode");

  /* ---------- Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function findScenario(id) {
    return SCENARIOS.find((s) => s.id === id);
  }

  function findModule(id) {
    return MODULES.find((m) => m.id === id);
  }

  function showToast(text) {
    const el = $("#role-toast");
    el.textContent = text;
    el.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove("is-visible"), 1800);
  }

  /* ---------- Module visibility ---------- */
  const VISIBILITY_KEY = "blueprint-module-visibility";
  const ADMIN_UNLOCK_KEY = "blueprint-admin-unlock";
  const ADMIN_PASSKEY = "keppa";
  const PACK_META = {
    blueprint: {
      label: "BHS Blueprint",
      shortLabel: "BHS",
      hash: "blueprint",
      defaultOn: false,
      glossary: "glossary",
      challenge: "challenge",
    },
    cfcRed: {
      label: "CFC Red",
      shortLabel: "CFC Red",
      hash: "cfc-red",
      defaultOn: true,
      glossary: "cfc-glossary",
      challenge: "cfc-challenge",
    },
    cfcFutsal: {
      label: "CFC Red Futsal",
      shortLabel: "Futsal",
      hash: "cfc-futsal",
      defaultOn: true,
      glossary: "futsal-glossary",
      challenge: "futsal-challenge",
    },
  };

  let visibility = loadVisibility();

  function loadVisibility() {
    try {
      const raw = localStorage.getItem(VISIBILITY_KEY);
      if (!raw) return { packs: {}, modules: {} };
      const parsed = JSON.parse(raw);
      return {
        packs: parsed && typeof parsed.packs === "object" && parsed.packs ? parsed.packs : {},
        modules: parsed && typeof parsed.modules === "object" && parsed.modules ? parsed.modules : {},
      };
    } catch {
      return { packs: {}, modules: {} };
    }
  }

  function saveVisibility() {
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(visibility));
  }

  function isPackEnabled(packKey) {
    if (typeof visibility.packs[packKey] === "boolean") return visibility.packs[packKey];
    return PACK_META[packKey] ? PACK_META[packKey].defaultOn : true;
  }

  function moduleFlag(moduleId) {
    if (typeof visibility.modules[moduleId] === "boolean") return visibility.modules[moduleId];
    return true;
  }

  function packKeyForModule(moduleId) {
    if (!moduleId) return null;
    const keys = Object.keys(PACK_META);
    for (let i = 0; i < keys.length; i += 1) {
      const id = keys[i];
      const meta = PACK_META[id];
      if (moduleId === meta.glossary || moduleId === meta.challenge) return id;
      const pack = PACKS[id];
      if (pack && (pack.MODULES || []).some((m) => m.id === moduleId)) return id;
    }
    if (String(moduleId).indexOf("futsal-") === 0) return "cfcFutsal";
    if (String(moduleId).indexOf("cfc-") === 0) return "cfcRed";
    return null;
  }

  function isModuleEnabled(moduleId, packKey) {
    const pid = packKey || packKeyForModule(moduleId);
    if (pid && !isPackEnabled(pid)) return false;
    return moduleFlag(moduleId);
  }

  function enabledPackList() {
    return Object.keys(PACK_META).filter((id) => isPackEnabled(id) && PACKS[id]);
  }

  function fallbackHash() {
    if (packId && isPackEnabled(packId)) return PACK_META[packId].hash;
    const enabled = enabledPackList();
    if (enabled.length === 1) return PACK_META[enabled[0]].hash;
    return "home";
  }

  function routeAllowed(route) {
    if (!route || route.view === "admin" || route.view === "home") return true;
    const byHash = Object.keys(PACK_META).find((id) => PACK_META[id].hash === route.view);
    const pid = byHash || packId;
    if (!pid || !isPackEnabled(pid)) return false;
    if (byHash) return true;
    if (route.view === "glossary") return isModuleEnabled(PACK_META[pid].glossary, pid);
    if (route.view === "challenge") return isModuleEnabled(PACK_META[pid].challenge, pid);
    if (route.view === "module" || route.view === "scenario") {
      return !!(route.moduleId && isModuleEnabled(route.moduleId, pid));
    }
    return true;
  }

  function applyVisibility() {
    const enabled = enabledPackList();
    $$("[data-pack]").forEach((el) => {
      el.hidden = !isPackEnabled(el.getAttribute("data-pack"));
    });
    $$("[data-pack-section]").forEach((el) => {
      el.hidden = !isPackEnabled(el.getAttribute("data-pack-section"));
    });
    $$("[data-module]").forEach((el) => {
      const id = el.getAttribute("data-module");
      el.hidden = !isModuleEnabled(id, packKeyForModule(id));
    });
    $$("[data-group-modules]").forEach((el) => {
      const pack = el.getAttribute("data-group-pack");
      const ids = (el.getAttribute("data-group-modules") || "").split(",").filter(Boolean);
      el.hidden = !ids.some((id) => isModuleEnabled(id, pack));
    });
    const areaSwitch = $(".area-switch");
    if (areaSwitch) areaSwitch.hidden = enabled.length < 2;
    document.body.classList.toggle("areas-many", enabled.length >= 3);
    const areasHeading = $("[data-areas-heading]");
    if (areasHeading) areasHeading.hidden = enabled.length < 2;
    syncAreaSelect();
  }

  function syncAreaSelect() {
    const sel = $("#area-switch-select");
    if (!sel) return;
    const enabled = enabledPackList();
    const onHome = state.view === "home" || state.view === "admin";
    const current = !onHome && PACK_META[packId] ? PACK_META[packId].hash : "home";
    const options = [{ hash: "home", label: "Areas" }].concat(
      enabled.map((id) => ({
        hash: PACK_META[id].hash,
        label: PACK_META[id].shortLabel || PACK_META[id].label,
      }))
    );
    sel.innerHTML = options
      .map((opt) => {
        const selected = opt.hash === current ? " selected" : "";
        return `<option value="${escapeHtml(opt.hash)}"${selected}>${escapeHtml(opt.label)}</option>`;
      })
      .join("");
  }

  function adminUnlocked() {
    try {
      return sessionStorage.getItem(ADMIN_UNLOCK_KEY) === "1";
    } catch {
      return false;
    }
  }

  function adminEntries(packKey) {
    const pack = PACKS[packKey];
    if (!pack) return [];
    const modules = pack.MODULES || [];
    const groups = pack.NAV_GROUPS || [];
    const emitted = new Set();
    const entries = [];
    modules.forEach((mod) => {
      const group = groups.find((g) => (g.modules || []).indexOf(mod.id) !== -1);
      if (group) {
        if (!emitted.has(group.id)) {
          emitted.add(group.id);
          entries.push({
            type: "group",
            id: group.id,
            label: group.label,
            modules: group.modules.map((id) => modules.find((m) => m.id === id)).filter(Boolean),
          });
        }
      } else {
        entries.push({ type: "module", module: mod });
      }
    });
    entries.push({
      type: "module",
      module: {
        id: PACK_META[packKey].glossary,
        title: "Glossary",
        subtitle: "Shared language",
      },
    });
    return entries;
  }

  function adminModuleRow(mod, depth) {
    const on = moduleFlag(mod.id);
    const cls = depth >= 2 ? "admin-row is-deep" : "admin-row is-nested";
    const detail = mod.subtitle || (mod.isChallenge ? "Mixed questions" : "");
    return `
      <label class="${cls}">
        <span class="admin-row-copy">
          <strong>${escapeHtml(mod.title)}</strong>
          ${detail ? `<span>${escapeHtml(detail)}</span>` : ""}
        </span>
        <span class="switch">
          <input type="checkbox" data-admin-module="${escapeHtml(mod.id)}" ${on ? "checked" : ""} aria-label="${escapeHtml(mod.title)}" />
          <span class="switch-ui" aria-hidden="true"></span>
        </span>
      </label>`;
  }

  function renderAdmin() {
    if (!adminUnlocked()) {
      root.innerHTML = `
        <section class="hero">
          <h1>Modules</h1>
          <p>Enter the passkey to show and hide areas and modules on this device.</p>
        </section>
        <form id="admin-gate" class="results-card">
          <label for="admin-passkey">Passkey</label>
          <div class="text-gate">
            <input id="admin-passkey" class="text-gate-input" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" />
            <button class="btn btn-primary" type="submit">Unlock</button>
          </div>
          <p id="admin-gate-error" class="muted" hidden>That passkey doesn’t match.</p>
        </form>`;
      const form = $("#admin-gate");
      const input = $("#admin-passkey");
      input?.focus();
      form?.addEventListener("submit", (e) => {
        e.preventDefault();
        if (String(input.value || "").trim().toLowerCase() !== ADMIN_PASSKEY) {
          const err = $("#admin-gate-error");
          if (err) err.hidden = false;
          input?.focus();
          return;
        }
        try {
          sessionStorage.setItem(ADMIN_UNLOCK_KEY, "1");
        } catch {
          /* ignore */
        }
        render();
      });
      return;
    }

    const packsHtml = Object.keys(PACK_META)
      .filter((packKey) => PACKS[packKey])
      .map((packKey) => {
        const meta = PACK_META[packKey];
        const packOn = isPackEnabled(packKey);
        const rows = adminEntries(packKey)
          .map((entry) => {
            if (entry.type === "group") {
              const ids = entry.modules.map((m) => m.id).join(",");
              return `
                <label class="admin-row is-nested">
                  <span class="admin-row-copy">
                    <strong>${escapeHtml(entry.label)}</strong>
                    <span>Turns every module in this group on or off</span>
                  </span>
                  <span class="switch">
                    <input type="checkbox" data-admin-group="${escapeHtml(entry.id)}" data-admin-modules="${escapeHtml(ids)}" aria-label="${escapeHtml(entry.label)}" />
                    <span class="switch-ui" aria-hidden="true"></span>
                  </span>
                </label>
                ${entry.modules.map((m) => adminModuleRow(m, 2)).join("")}`;
            }
            return adminModuleRow(entry.module, 1);
          })
          .join("");
        return `
          <section class="admin-pack ${packOn ? "" : "is-off"}">
            <label class="admin-row admin-pack-head">
              <span class="admin-row-copy">
                <strong>${escapeHtml(meta.label)}</strong>
                <span>Whole area</span>
              </span>
              <span class="switch">
                <input type="checkbox" data-admin-pack="${escapeHtml(packKey)}" ${packOn ? "checked" : ""} aria-label="${escapeHtml(meta.label)}" />
                <span class="switch-ui" aria-hidden="true"></span>
              </span>
            </label>
            ${packOn ? "" : `<p class="admin-pack-note">Hidden while this area is off. Switches underneath still save.</p>`}
            ${rows}
          </section>`;
      })
      .join("");

    root.innerHTML = `
      <div class="section-header">
        <div>
          <h1>Modules</h1>
          <p>Turn an area off to hide it. Turn a module off to hide that lesson. Saved on this device — other phones keep the starting setup until changed there.</p>
        </div>
        <div class="module-card-actions">
          <button type="button" class="btn btn-ghost" id="admin-lock">Lock</button>
          <a class="btn btn-secondary" href="#home">Done</a>
        </div>
      </div>
      <div class="admin-stack">${packsHtml}</div>
      <div class="module-card-actions" style="margin-top:1rem">
        <button type="button" class="btn btn-ghost" id="admin-reset-visibility">Reset to starting setup</button>
      </div>`;

    $$("[data-admin-group]").forEach((input) => {
      const ids = (input.getAttribute("data-admin-modules") || "").split(",").filter(Boolean);
      const flags = ids.map((id) => moduleFlag(id));
      const allOn = flags.length > 0 && flags.every(Boolean);
      const allOff = flags.length > 0 && flags.every((on) => !on);
      input.checked = allOn;
      input.indeterminate = !allOn && !allOff;
      input.closest(".switch")?.classList.toggle("is-mixed", input.indeterminate);
    });

    $$("[data-admin-pack]").forEach((input) => {
      input.addEventListener("change", () => {
        visibility.packs[input.getAttribute("data-admin-pack")] = input.checked;
        saveVisibility();
        render();
      });
    });
    $$("[data-admin-module]").forEach((input) => {
      input.addEventListener("change", () => {
        visibility.modules[input.getAttribute("data-admin-module")] = input.checked;
        saveVisibility();
        render();
      });
    });
    $$("[data-admin-group]").forEach((input) => {
      input.addEventListener("change", () => {
        const on = input.checked;
        (input.getAttribute("data-admin-modules") || "")
          .split(",")
          .filter(Boolean)
          .forEach((id) => {
            visibility.modules[id] = on;
          });
        saveVisibility();
        render();
      });
    });
    $("#admin-lock")?.addEventListener("click", () => {
      try {
        sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
      } catch {
        /* ignore */
      }
      render();
    });
    $("#admin-reset-visibility")?.addEventListener("click", () => {
      if (!confirm("Reset module visibility to the starting setup on this device?")) return;
      visibility = { packs: {}, modules: {} };
      try {
        localStorage.removeItem(VISIBILITY_KEY);
      } catch {
        /* ignore */
      }
      render();
      showToast("Module setup reset");
    });
  }

  /* ---------- Routing ---------- */
  function detectPackId(raw) {
    if (!raw || raw === "home" || raw === "admin") return null;
    const order = ["cfcFutsal", "cfcRed", "blueprint"];
    for (let i = 0; i < order.length; i += 1) {
      const id = order[i];
      const meta = PACK_META[id];
      const pack = PACKS[id];
      if (!meta || !pack) continue;
      if (raw === meta.hash || raw === meta.glossary || raw === meta.challenge) return id;
      if ((pack.MODULES || []).some((m) => m.hash === raw || m.id === raw)) return id;
      if ((pack.SCENARIOS || []).some((s) => s.id === raw || s.chapter === raw)) return id;
    }
    if (raw.indexOf("futsal-") === 0) return PACKS.cfcFutsal ? "cfcFutsal" : null;
    if (raw === "cfc-red" || raw.indexOf("cfc-") === 0) return PACKS.cfcRed ? "cfcRed" : null;
    return "blueprint";
  }

  function parseHash() {
    const raw = (location.hash || "#home").replace(/^#/, "");
    if (raw === "admin") return { view: "admin" };
    const nextPack = detectPackId(raw);
    if (nextPack) bindPack(nextPack);

    if (!raw || raw === "home") return { view: "home" };
    const homePack = Object.keys(PACK_META).find((id) => PACK_META[id].hash === raw);
    if (homePack) return { view: PACK_META[homePack].hash };
    const glossOrChallenge = Object.keys(PACK_META).find(
      (id) => PACK_META[id].glossary === raw || PACK_META[id].challenge === raw
    );
    if (glossOrChallenge && PACK_META[glossOrChallenge].glossary === raw) return { view: "glossary" };
    if (glossOrChallenge && PACK_META[glossOrChallenge].challenge === raw) return { view: "challenge" };

    const mod = MODULES.find((m) => m.hash === raw || m.id === raw);
    if (mod) {
      if (mod.isChallenge) return { view: "challenge" };
      return { view: "module", moduleId: mod.id };
    }

    const scenario = findScenario(raw);
    if (scenario) {
      return { view: "scenario", moduleId: scenario.module, scenarioId: scenario.id };
    }

    // chapter hashes like attack-the-moment / cfc-attack-the-moment
    const byChapter = SCENARIOS.find((s) => s.chapter === raw);
    if (byChapter) return { view: "module", moduleId: byChapter.module };

    return { view: "home" };
  }

  function navigate(hash) {
    if (hash.startsWith("#")) location.hash = hash;
    else location.hash = "#" + hash;
  }

  function isBlueprintArea(view) {
    return view !== "home" && view !== "admin" && packId === "blueprint";
  }

  function isCfcRedArea(view) {
    return view !== "home" && view !== "admin" && packId === "cfcRed";
  }

  function isFutsalArea(view) {
    return view !== "home" && view !== "admin" && packId === "cfcFutsal";
  }

  function applyPackColors(futsal) {
    const rootStyle = document.documentElement.style;
    const keys = ["--ours", "--ours-stroke", "--opp", "--opp-stroke", "--brand", "--brand-strong"];
    keys.forEach((key) => rootStyle.removeProperty(key));
    if (!futsal || !CONFIG || !CONFIG.colors) return;
    const c = CONFIG.colors;
    if (c.ours) rootStyle.setProperty("--ours", c.ours);
    if (c.oursStroke) rootStyle.setProperty("--ours-stroke", c.oursStroke);
    if (c.opp) rootStyle.setProperty("--opp", c.opp);
    if (c.oppStroke) rootStyle.setProperty("--opp-stroke", c.oppStroke);
    if (c.ours) rootStyle.setProperty("--brand", c.ours);
    if (c.oursStroke) rootStyle.setProperty("--brand-strong", c.oursStroke);
  }

  function updateChrome(view, moduleId) {
    const blueprintArea = isBlueprintArea(view);
    const cfcArea = isCfcRedArea(view);
    const futsalArea = isFutsalArea(view);
    document.body.classList.toggle("admin-view", view === "admin");
    document.body.classList.toggle("blueprint-view", blueprintArea || cfcArea || futsalArea);
    document.body.classList.toggle("hub-view", view === "home");
    document.body.classList.toggle("futsal-mode", futsalArea);
    applyPackColors(futsalArea);

    const brandSub = $("#brand-sub");
    let sub = "";
    if (view === "admin") sub = "Admin";
    else if (view === "home") {
      const labels = enabledPackList().map((id) => PACK_META[id].shortLabel || PACK_META[id].label);
      sub = labels.join(" · ") || "Modules off";
    } else if (futsalArea) sub = "CFC Red Futsal";
    else if (cfcArea) sub = "CFC Red";
    else sub = "BHS Blueprint";
    if (brandSub) brandSub.textContent = sub;
    applyBrand(view, sub);

    const blueprintNav = $(".nav-blueprint");
    const cfcNav = $(".nav-cfc-red");
    const futsalNav = $(".nav-futsal");
    if (blueprintNav) blueprintNav.hidden = !blueprintArea;
    if (cfcNav) cfcNav.hidden = !cfcArea;
    if (futsalNav) futsalNav.hidden = !futsalArea;

    $$("[data-area]").forEach((el) => {
      const area = el.getAttribute("data-area");
      const on =
        (area === "blueprint" && blueprintArea) ||
        (area === "cfc-red" && cfcArea) ||
        (area === "cfc-futsal" && futsalArea);
      if (on) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
      if (view === "home") el.removeAttribute("aria-current");
    });

    document.body.classList.toggle("blueprint-mode", blueprintArea || view === "home");
    document.body.classList.toggle("cfc-red-mode", cfcArea);
    document.body.classList.toggle("futsal-mode", futsalArea);
    if (view === "home" || view === "admin") {
      document.body.classList.remove("blueprint-mode", "cfc-red-mode", "futsal-mode");
      document.body.classList.toggle("hub-mode", view === "home");
    } else {
      document.body.classList.remove("hub-mode");
    }

    setNavCurrent(view, moduleId);
    applyVisibility();
  }

  function brandKeyFor(view) {
    const inCfc = packId === "cfcRed" || packId === "cfcFutsal";
    if (view !== "home" && view !== "admin") return inCfc ? "cfc" : "bhs";
    if (view === "admin" && inCfc) return "cfc";
    if (view === "admin" && packId === "blueprint" && isPackEnabled("blueprint")) return "bhs";
    const enabled = enabledPackList();
    const hasBhs = enabled.indexOf("blueprint") !== -1;
    const hasCfc = enabled.indexOf("cfcRed") !== -1 || enabled.indexOf("cfcFutsal") !== -1;
    if (hasCfc && !hasBhs) return "cfc";
    if (hasBhs && !hasCfc) return "bhs";
    return "mixed";
  }

  function applyBrand(view, sub) {
    const key = brandKeyFor(view);
    const logo = $("#brand-logo");
    const name = $("#brand-name");
    const icon = document.querySelector('link[rel="icon"]');
    document.body.classList.toggle("brand-cfc", key === "cfc");
    document.body.classList.toggle("brand-bhs", key === "bhs");
    document.body.classList.toggle("brand-mixed", key === "mixed");
    if (key === "cfc") {
      if (name) name.textContent = "CFC";
      if (logo) {
        logo.hidden = false;
        logo.src = "assets/cfc-logo.svg";
        logo.alt = "CFC";
      }
      if (icon) icon.href = "assets/cfc-logo.svg";
      document.title = sub ? "CFC — " + sub : "CFC";
      return;
    }
    if (key === "bhs") {
      if (name) name.textContent = "Brighton Girls";
      if (logo) {
        logo.hidden = false;
        logo.src = "assets/logo.svg";
        logo.alt = "Brighton Girls";
      }
      if (icon) icon.href = "assets/logo.svg";
      document.title = sub ? "Brighton Girls — " + sub : "Brighton Girls";
      return;
    }
    if (name) name.textContent = "";
    if (logo) logo.hidden = true;
    if (icon) icon.href = "assets/logo.svg";
    document.title = sub || "Tactical learning";
  }

  function setNavCurrent(view, moduleId) {
    const mod = moduleId ? findModule(moduleId) : null;
    const meta = PACK_META[packId] || PACK_META.blueprint;
    const groupId = mod?.group || null;

    $$("[data-nav]").forEach((el) => {
      const key = el.getAttribute("data-nav");
      const current =
        (view === "home" && key === "hub") ||
        (view === meta.hash && (key === meta.hash || key === meta.hash + "-area")) ||
        (view === "glossary" && key === meta.glossary) ||
        (view === "challenge" && key === meta.challenge) ||
        (view === "module" && key === moduleId) ||
        (view === "scenario" && key === moduleId);
      if (current) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });

    $$("[data-nav-group]").forEach((el) => {
      const key = el.getAttribute("data-nav-group");
      if (groupId && key === groupId) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
  }

  function pitchFrame(scenario) {
    const futsal = CONFIG && CONFIG.pitch && CONFIG.pitch.kind === "futsal";
    if (scenario.pitchView) {
      return {
        futsal,
        view: scenario.pitchView,
        w: PW,
        h: PL,
      };
    }
    if (futsal) {
      return {
        futsal: true,
        view: { x: -1.1, y: -1.35, w: PW + 2.2, h: PL + 2.7 },
        w: PW,
        h: PL,
      };
    }
    return { futsal: false, view: { x: 0, y: 0, w: PW, h: PL }, w: PW, h: PL };
  }

  function futsalMarkings(w, h, line, sw) {
    const goalW = 3;
    const goalD = 0.7;
    const goalX = (w - goalW) / 2;
    const cx = w / 2;
    const arc = (y0, yFront, sweep) => {
      const leftOut = 8.5 - 6;
      const rightOut = 11.5 + 6;
      return `<path d="M ${leftOut} ${y0} A 6 6 0 0 ${sweep} 8.42 ${yFront} L 11.58 ${yFront} A 6 6 0 0 ${sweep} ${rightOut} ${y0}" fill="none" stroke="${line}" stroke-width="${sw}" />`;
    };
    return `
      <rect x="0.35" y="0.35" width="${w - 0.7}" height="${h - 0.7}" fill="none" stroke="${line}" stroke-width="${sw}" />
      <line x1="0.35" y1="${h / 2}" x2="${w - 0.35}" y2="${h / 2}" stroke="${line}" stroke-width="${sw * 0.85}" stroke-dasharray="0.55 0.4" />
      <circle cx="${cx}" cy="${h / 2}" r="3" fill="none" stroke="${line}" stroke-width="${sw * 0.85}" />
      <circle cx="${cx}" cy="${h / 2}" r="0.12" fill="${line}" />
      <rect x="${goalX}" y="${-goalD}" width="${goalW}" height="${goalD}" fill="none" stroke="${line}" stroke-width="${sw}" />
      <rect x="${goalX}" y="${h}" width="${goalW}" height="${goalD}" fill="none" stroke="${line}" stroke-width="${sw}" />
      ${arc(0, 6, 0)}
      ${arc(h, h - 6, 1)}
      <circle cx="${cx}" cy="6" r="0.12" fill="${line}" />
      <circle cx="${cx}" cy="10" r="0.1" fill="${line}" />
      <circle cx="${cx}" cy="${h - 6}" r="0.12" fill="${line}" />
      <circle cx="${cx}" cy="${h - 10}" r="0.1" fill="${line}" />
    `;
  }

  function outdoorMarkings(line) {
    const goalW = 7.32;
    const goalX = (PW - goalW) / 2;
    return `
      <rect x="1" y="1" width="${PW - 2}" height="${PL - 2}" fill="none" stroke="${line}" stroke-width="0.45" />
      <line x1="1" y1="${PL / 2}" x2="${PW - 1}" y2="${PL / 2}" stroke="${line}" stroke-width="0.35" />
      <circle cx="${PW / 2}" cy="${PL / 2}" r="9.15" fill="none" stroke="${line}" stroke-width="0.35" />
      <circle cx="${PW / 2}" cy="${PL / 2}" r="0.5" fill="${line}" />
      <rect x="${goalX}" y="0.15" width="${goalW}" height="0.85" fill="none" stroke="${line}" stroke-width="0.4" />
      <rect x="${goalX}" y="${PL - 1}" width="${goalW}" height="0.85" fill="none" stroke="${line}" stroke-width="0.4" />
      <rect x="${(PW - 40.32) / 2}" y="1" width="40.32" height="16.5" fill="none" stroke="${line}" stroke-width="0.35" />
      <rect x="${(PW - 18.32) / 2}" y="1" width="18.32" height="5.5" fill="none" stroke="${line}" stroke-width="0.35" />
      <rect x="${(PW - 40.32) / 2}" y="${PL - 17.5}" width="40.32" height="16.5" fill="none" stroke="${line}" stroke-width="0.35" />
      <rect x="${(PW - 18.32) / 2}" y="${PL - 6.5}" width="18.32" height="5.5" fill="none" stroke="${line}" stroke-width="0.35" />
    `;
  }

  /* ---------- Pitch SVG ---------- */
  function pitchMarkup(scenario, opts = {}) {
    const hideLabels = opts.hideLabels || false;
    const showCoachTargets = state.coach;
    const frame = pitchFrame(scenario);
    const view = frame.view;
    drawScale = frame.futsal ? PW / 68 : 1;
    const stripes = [];
    if (frame.futsal) {
      for (let i = 0; i < 8; i += 1) {
        stripes.push(
          `<rect class="grass-stripe" x="${i * (PW / 8)}" y="0" width="${PW / 16}" height="${PL}" />`
        );
      }
    } else {
      for (let i = 0; i < 6; i += 1) {
        stripes.push(
          `<rect class="grass-stripe" x="0" y="${i * (PL / 6)}" width="${PW}" height="${PL / 12}" />`
        );
      }
    }

    const zones = (scenario.zones || [])
      .map((z) => {
        const interactive = scenario.interactionType === "pitch-hotspot";
        const cls = interactive ? "hotspot-zone" : "teaching-zone";
        const attrs = interactive
          ? `tabindex="0" role="button" aria-label="${escapeHtml(z.label || z.id)}"`
          : `pointer-events="none" aria-hidden="true"`;
        const rx = frame.futsal ? 0.35 : 1.2;
        return `<rect class="${cls}" data-zone-id="${escapeHtml(z.id)}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="${rx}" ${attrs} />`;
      })
      .join("");

    let coachTargets = "";
    if (showCoachTargets) {
      if (scenario.dragTarget) {
        const t = scenario.dragTarget;
        coachTargets += `<circle class="coach-target coach-only" cx="${t.x}" cy="${t.y}" r="${t.r || (frame.futsal ? 1.6 : 6)}" />`;
      }
      (scenario.zones || []).forEach((z) => {
        if (z.id === scenario.correctAnswer) {
          const rx = frame.futsal ? 0.35 : 1.2;
          coachTargets += `<rect class="coach-target coach-only" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="${rx}" />`;
        }
      });
    }

    const tokens = []
      .concat(scenario.opponents || [], scenario.players || [])
      .map((p) => tokenMarkup(p, hideLabels))
      .join("");

    const ball = scenario.ball ? ballMarkup(scenario.ball.x, scenario.ball.y) : "";
    const line = "var(--pitch-line)";
    const marker = frame.futsal ? 1.15 : 4;
    const markings = frame.futsal
      ? futsalMarkings(frame.w, frame.h, line, 0.12)
      : outdoorMarkings(line);

    return `
      <svg class="pitch-svg${frame.futsal ? " is-futsal" : ""}" viewBox="${view.x} ${view.y} ${view.w} ${view.h}" role="img" aria-label="${frame.futsal ? "Futsal court diagram" : "Tactical pitch diagram"}">
        <defs>
          <marker id="arrowhead" markerWidth="${marker}" markerHeight="${marker}" refX="${marker * 0.75}" refY="${marker / 2}" orient="auto">
            <path d="M0,0 L${marker},${marker / 2} L0,${marker} Z" fill="var(--brand)" />
          </marker>
        </defs>
        ${stripes.join("")}
        ${markings}
        <g id="pitch-zones">${zones}</g>
        <g id="pitch-coach">${coachTargets}</g>
        <g id="pitch-anim"></g>
        <g id="pitch-players">${tokens}</g>
        ${ball}
      </svg>
    `;
  }

  function placedTransform(x, y, scale) {
    const s = scale == null ? drawScale : scale;
    if (!s || s === 1) return `translate(${x},${y})`;
    return `translate(${x},${y}) scale(${s})`;
  }

  function ballMarkup(x, y) {
    const scaleAttr = drawScale === 1 ? "" : ` data-scale="${drawScale}"`;
    return `
      <g class="ball" id="pitch-ball" data-x="${x}" data-y="${y}"${scaleAttr} transform="${placedTransform(x, y)}">
        <text class="ball-emoji" text-anchor="middle" dominant-baseline="central">⚽</text>
      </g>
    `;
  }

  function setBallPos(el, x, y) {
    if (!el) return;
    const scale = parseFloat(el.dataset.scale || "1");
    el.setAttribute("transform", placedTransform(x, y, scale));
    el.dataset.x = x;
    el.dataset.y = y;
  }

  function getBallPos(el) {
    return {
      x: parseFloat(el?.dataset.x || 0),
      y: parseFloat(el?.dataset.y || 0),
    };
  }

  /** US Soccer–style triangles: attack ▲, defense ▼ — drawn in local coords, moved via transform */
  function tokenMarkup(p, hideLabels) {
    const isOpp = p.team === "opp";
    const cls = isOpp ? "player-token opp" : "player-token";
    const role = hideLabels || p.hideLabel ? "" : tokenAbbrev(p);
    const roleText = role
      ? `<text class="token-role" x="0" y="3.15">${escapeHtml(role)}</text>`
      : "";
    // Smaller triangles so pitch scale reads clearly
    const shape = isOpp
      ? `<polygon class="token-disk" points="0,1.55 -1.45,-1.15 1.45,-1.15" />` // ▼
      : `<polygon class="token-disk" points="0,-1.55 -1.45,1.15 1.45,1.15" />`; // ▲
    const keeperRing = String(p.number) === "GK"
      ? `<circle class="token-keeper-ring" cx="0" cy="0" r="1.95" fill="none" />`
      : "";
    const numY = isOpp ? "-0.15" : "0.45";
    const fullRole = roleFullName(p);
    const numStr = String(p.number);
    const numClass = numStr.length > 2 || numStr === "GK" ? "token-num token-num-sm" : "token-num";
    const scaleAttr = drawScale === 1 ? "" : ` data-scale="${drawScale}"`;
    return `
      <g class="${cls}" data-player-id="${escapeHtml(p.id)}" data-role="${escapeHtml(fullRole)}" data-number="${escapeHtml(numStr)}" data-x="${p.x}" data-y="${p.y}"${scaleAttr} transform="${placedTransform(p.x, p.y)}">
        ${keeperRing}
        ${shape}
        <text class="${numClass}" x="0" y="${numY}">${escapeHtml(numStr)}</text>
        ${roleText}
      </g>
    `;
  }

  function setTokenPos(g, x, y) {
    const scale = parseFloat(g.dataset.scale || "1");
    g.setAttribute("transform", placedTransform(x, y, scale));
    g.dataset.x = x;
    g.dataset.y = y;
  }

  function getTokenPos(g) {
    return {
      x: parseFloat(g.dataset.x || 0),
      y: parseFloat(g.dataset.y || 0),
    };
  }

  /** Standard shirt symbology — number inside triangle, abbrev below */
  const SHIRT_ABBREV = {
    1: "GK",
    2: "RB",
    3: "LB",
    4: "RCB",
    5: "LCB",
    6: "DM",
    7: "RW",
    8: "CM",
    9: "CF",
    10: "AM",
    11: "LW",
  };

  const SHIRT_FULL = {
    1: "Goalkeeper",
    2: "Right back",
    3: "Left back",
    4: "Right center back",
    5: "Left center back",
    6: "Defensive midfielder",
    7: "Right winger",
    8: "Central midfielder",
    9: "Center forward",
    10: "Attacking midfielder",
    11: "Left winger",
  };

  function tokenAbbrev(p) {
    if (p.label) return p.label;
    if (p.role) {
      const fromRole = shortRole(p.role);
      if (fromRole) return fromRole;
    }
    const n = Number(p.number);
    if (Number.isInteger(n) && SHIRT_ABBREV[n]) return SHIRT_ABBREV[n];
    return "";
  }

  function roleFullName(p) {
    if (p.role) return p.role;
    const n = Number(p.number);
    if (Number.isInteger(n) && SHIRT_FULL[n]) return SHIRT_FULL[n];
    return "";
  }

  function shortRole(role) {
    if (!role) return "";
    const map = {
      Goalkeeper: "GK",
      "Right back": "RB",
      "Left back": "LB",
      "Right fullback": "RB",
      "Left fullback": "LB",
      "Right wingback": "RWB",
      "Left wingback": "LWB",
      "Right center back": "RCB",
      "Left center back": "LCB",
      "Center back": "CB",
      "Defensive midfielder": "DM",
      "Central midfielder": "CM",
      "Attacking midfielder": "AM",
      "Right winger": "RW",
      "Left winger": "LW",
      "Center forward": "CF",
      "Wide point": "Wide",
      "Half-space point": "½-sp",
      "Deep support": "Deep",
      "Box threat": "Box",
      "Wide defender": "WD",
      "Far-side wide": "Far",
      Skittles: "Skit",
      Stockton: "Stk",
      Malone: "Mal",
      Spot: "Spt",
      Shield: "Shld",
      Screen: "Scr",
      Primary: "Stk",
      Secondary: "Mal",
      Drop: "Shld",
      Block: "Scr",
      "Near-post run": "Near",
      "Far-post run": "Far",
      "Cutback run": "Cut",
      "Front Target": "FT",
      "Back Target": "BT",
      "Corner Defense": "CD",
      "Corner defense": "CD",
      "Corner defender": "Def",
      "Back-post group": "BP",
      "A — wide": "A",
      "B — half-space": "B",
      "C — deep": "C",
    };
    return map[role] || role.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  }

  /* ---------- Session ---------- */
  function createSession(scenario, challengeMode) {
    const options = scenario.options ? shuffle(scenario.options) : [];
    const rationaleOptions = scenario.rationaleOptions
      ? shuffle(scenario.rationaleOptions)
      : [];
    return {
      scenario,
      challengeMode: !!challengeMode,
      stage: "decision",
      attempts: 0,
      decisionCorrect: false,
      rationaleCorrect: null,
      selected: null,
      selectedRationale: null,
      revealUnlocked: false,
      options,
      rationaleOptions,
      matchSelections: [],
      orderItems: scenario.sequence ? shuffle(scenario.sequence.map((s) => ({ ...s }))) : [],
      runChoice: null,
      passChoice: null,
      locked: false,
      animating: false,
    };
  }

  /* ---------- Rendering views ---------- */
  const root = $("#app-root");

  function render() {
    animGeneration += 1;
    const route = parseHash();
    if (route.view === "home") {
      const enabled = enabledPackList();
      if (enabled.length === 1) {
        navigate(PACK_META[enabled[0]].hash);
        return;
      }
    } else if (route.view !== "admin" && !routeAllowed(route)) {
      const next = fallbackHash();
      const current = (location.hash || "#home").replace(/^#/, "");
      if (current !== next) {
        navigate(next);
        return;
      }
    }
    state.view = route.view;
    state.moduleId = route.moduleId || null;
    state.scenarioId = route.scenarioId || null;
    updateChrome(state.view, state.moduleId);

    if (state.view === "admin") renderAdmin();
    else if (state.view === "home") renderHub();
    else if (Object.keys(PACK_META).some((id) => PACK_META[id].hash === state.view)) renderPackHome();
    else if (state.view === "glossary") renderGlossary();
    else if (state.view === "challenge") renderChallenge();
    else if (state.view === "module") renderModule(state.moduleId);
    else if (state.view === "scenario") renderScenario(state.scenarioId);
    else renderHub();

    window.scrollTo(0, 0);
  }

  function renderHub() {
    const cards = [];
    if (isPackEnabled("blueprint")) {
      cards.push(`
        <a class="hub-card" href="#blueprint">
          <h2>BHS Blueprint</h2>
          <p>11v11 tactical learning — 4-3-3, 2-3-5 attack, 4-4-2 defense, and set pieces.</p>
          <span class="hub-card-cta">Open modules</span>
        </a>`);
    }
    if (isPackEnabled("cfcRed")) {
      cards.push(`
        <a class="hub-card hub-card-cfc" href="#cfc-red">
          <h2>CFC Red</h2>
          <p>U12 boys 9v9 — 4-1-2-1 (6 distinct from 8/10), 2-3-3 attack, same corner language.</p>
          <span class="hub-card-cta">Open modules</span>
        </a>`);
    }
    if (isPackEnabled("cfcFutsal")) {
      cards.push(`
        <a class="hub-card hub-card-futsal" href="#cfc-futsal">
          <h2>CFC Red Futsal</h2>
          <p>U12 futsal — four jobs, Zone 14, and a compact diamond. Players rotate. The spaces stay filled.</p>
          <span class="hub-card-cta">Open modules</span>
        </a>`);
    }
    const empty = cards.length
      ? ""
      : `<p class="empty-state">No areas are turned on. Use the gear at the top right, then Manage modules.</p>`;
    const hubBrand = brandKeyFor("home");
    const hubTitle = hubBrand === "cfc" ? "CFC" : hubBrand === "bhs" ? "Brighton Girls" : "Tactical learning";
    root.innerHTML = `
      <section class="hero hub-hero">
        <h1>${escapeHtml(hubTitle)}</h1>
        <p>${hubBrand === "mixed" ? "Pick a game model and work the modules." : "Tactical learning — pick a game model and work the modules."}</p>
      </section>
      ${empty}
      <section class="hub-grid" aria-label="App areas">${cards.join("")}</section>
    `;
  }

  function renderPackHome() {
    const challengeHash = (PACK_META[packId] && PACK_META[packId].challenge) || "challenge";
    const challengeQs = CONFIG.challengeCount || 10;
    const visible = MODULES.filter((m) => isModuleEnabled(m.id));
    const cards = visible.map((m) => {
      if (m.isChallenge) {
        return `
          <article class="module-card challenge-card">
            <div class="module-card-top">
              <div>
                <h2>${escapeHtml(m.title)}</h2>
                <p class="purpose">${escapeHtml(m.purpose)}</p>
              </div>
              <span class="mastery-badge">${challengeQs} Qs</span>
            </div>
            <div class="module-card-actions">
              <a class="btn btn-primary" href="#${escapeHtml(challengeHash)}">Start challenge</a>
            </div>
          </article>
        `;
      }
      const stats = moduleStats(m.id);
      const started = stats.completed > 0;
      return `
        <article class="module-card">
          <div class="module-card-top">
            <div>
              <h2>${escapeHtml(m.title)}</h2>
              ${m.subtitle ? `<p class="purpose" style="margin:0.15rem 0 0;color:var(--accent);font-size:0.82rem;font-weight:700">${escapeHtml(m.subtitle)}</p>` : ""}
              <p class="purpose">${escapeHtml(m.purpose)}</p>
            </div>
            <span class="mastery-badge ${stats.masteryLabel}">${stats.masteryLabel}</span>
          </div>
          <div class="progress-row">
            <div class="progress-meta">
              <span>${stats.completed}/${stats.total} scenarios</span>
              <span>${stats.masteryPct}% mastery</span>
            </div>
            <div class="progress-bar" aria-hidden="true"><div class="progress-fill" style="width:${stats.masteryPct}%"></div></div>
          </div>
          <div class="module-card-actions">
            <a class="btn btn-primary" href="#${escapeHtml(m.hash)}">${started ? "Continue" : "Start"}</a>
            ${(() => {
              const missed = moduleScenarios(m.id).find((s) => {
                const p = getScenarioProgress(s.id);
                return p.needsReview || (p.attempts > 0 && !p.decisionCorrect);
              });
              return missed
                ? `<a class="btn btn-ghost" href="#${escapeHtml(missed.id)}">Review missed</a>`
                : "";
            })()}
          </div>
        </article>
      `;
    }).join("");

    const overall = visible.filter((m) => !m.isChallenge).reduce(
      (acc, m) => {
        const s = moduleStats(m.id);
        acc.done += s.completed;
        acc.total += s.total;
        return acc;
      },
      { done: 0, total: 0 }
    );

    const blurb =
      packId === "cfcFutsal"
        ? "See it, choose it, explain it. Four jobs, Zone 14, and a diamond that can flex. Freedom to rotate. Obligation to rebalance."
        : packId === "cfcRed"
          ? "See it, choose it, explain it. Train the 4-1-2-1 game model — 2-3-3 in attack, and corners."
          : "See it, choose it, explain it. Train attacking shape, wide patterns, supporting runs, defensive shape, and set pieces.";

    root.innerHTML = `
      <section class="hero">
        <h1>${escapeHtml(packHomeLabel())}</h1>
        <p>${escapeHtml(blurb)}</p>
        <div class="hero-meta">
          <span class="pill">Progress <strong>${overall.done}/${overall.total}</strong></span>
          <span class="pill">Saved on this device</span>
        </div>
      </section>
      <section class="module-grid" aria-label="Modules">${cards || `<p class="empty-state">Every module in this area is off. Use the gear at the top right, then Manage modules.</p>`}</section>
    `;
  }

  function packHomeHash() {
    return (PACK_META[packId] && PACK_META[packId].hash) || "blueprint";
  }

  function packHomeLabel() {
    return CONFIG.appName || (PACK_META[packId] && PACK_META[packId].label) || "Blueprint";
  }

  function renderGlossary() {
    const items = GLOSSARY.map(
      (g) => `
      <div class="glossary-item">
        <dl>
          <dt>${escapeHtml(g.term)}</dt>
          <dd>${escapeHtml(g.definition)}</dd>
        </dl>
      </div>`
    ).join("");
    const intro =
      packId === "cfcFutsal"
        ? "Words for CFC Red Futsal. Jobs are spaces. The player in the space can change."
        : packId === "cfcRed"
          ? "Shared language for CFC Red’s 9v9 model. Short definitions — not essays."
          : "Shared language for Brighton’s model. Short definitions — not essays.";
    root.innerHTML = `
      <div class="section-header">
        <div>
          <h1>Glossary</h1>
          <p>${escapeHtml(intro)}</p>
        </div>
        <a class="btn btn-secondary" href="#${escapeHtml(packHomeHash())}">Back</a>
      </div>
      <div class="glossary-grid">${items}</div>
    `;
  }

  function renderModule(moduleId) {
    const mod = findModule(moduleId);
    if (!mod || mod.isChallenge) {
      navigate(fallbackHash());
      return;
    }
    const stats = moduleStats(moduleId);
    const list = moduleScenarios(moduleId);
    const overviewOpen = !(state.progress.overviewDismissed || {})[moduleId];
    const ov = mod.overview;

    const rows = list
      .map((s, i) => {
        const p = getScenarioProgress(s.id);
        let status = "Not started";
        let cls = "";
        if (s.persistProgress === false) {
          status = "Unlock each visit";
        } else if (p.completed && p.decisionCorrect) {
          status = "Complete";
          cls = "is-complete";
        } else if (p.needsReview || (p.attempts > 0 && !p.decisionCorrect)) {
          status = "Review";
          cls = "is-missed";
        } else if (p.attempts > 0) {
          status = "In progress";
        }
        const chapterLabel = s.chapterTitle || ({
          "basics-numbers": "Numbers & codes",
          "basics-shapes": "Shape shifts",
          "attack-the-moment": "Attack the moment",
          "create-2-3-5": "Create the 2-3-5",
          "wide-attack": "Wide attack patterns",
          "supporting-runs": "Supporting runs",
          "defensive-responsibilities": "Part 1 · Matchups",
          "defend-4-4-2": "Part 2 · 4-4-2",
          "corner-lock": "Locked play",
          "short-corners": "Part 1 · Go Short",
          "long-corners": "Part 2 · Go Long",
        })[s.chapter] || s.chapter || "";
        return `
          <a class="scenario-row ${cls}" href="#${escapeHtml(s.id)}">
            <span class="scenario-index">${i + 1}</span>
            <span class="scenario-info">
              <strong>${escapeHtml(s.title)}</strong>
              <span>${escapeHtml(chapterLabel)} · ${escapeHtml(s.interactionType)}</span>
            </span>
            <span class="scenario-status">${status}</span>
          </a>
        `;
      })
      .join("");

    const overviewHtml = ov
      ? `
      <section class="module-overview ${overviewOpen ? "is-open" : "is-collapsed"}" id="module-overview">
        <div class="module-overview-header">
          <div>
            <p class="overview-kicker">Before you start</p>
            <h2>${escapeHtml(ov.headline)}</h2>
          </div>
          <button type="button" class="btn btn-ghost" id="toggle-overview">
            ${overviewOpen ? "Hide overview" : "Show overview"}
          </button>
        </div>
        <div class="module-overview-body" ${overviewOpen ? "" : "hidden"}>
          <p class="overview-intro">${escapeHtml(ov.intro)}</p>
          <div class="principle-grid">
            ${(ov.principles || [])
              .map(
                (pr) => `
              <article class="principle-card">
                <h3>${escapeHtml(pr.title)}</h3>
                <p>${escapeHtml(pr.body)}</p>
              </article>`
              )
              .join("")}
          </div>
          ${
            ov.cues && ov.cues.length
              ? `<div class="cue-strip">
                  <span class="label">Cues you will see</span>
                  <ul>${ov.cues.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
                </div>`
              : ""
          }
          <div class="module-card-actions" style="margin-top:1rem">
            <a class="btn btn-primary" href="#${escapeHtml(list[0] ? list[0].id : "home")}" id="begin-scenarios">Begin scenarios</a>
            <button type="button" class="btn btn-secondary" id="skip-to-list">Skip to scenario list</button>
          </div>
        </div>
      </section>`
      : "";

    root.innerHTML = `
      <div class="section-header">
        <div>
          <h1>${escapeHtml(mod.title)}</h1>
          <p>${escapeHtml(mod.purpose)}</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <a class="btn btn-ghost" href="#${escapeHtml(packHomeHash())}">Modules</a>
          ${
            ov
              ? `<button type="button" class="btn btn-secondary" id="header-show-overview">${overviewOpen ? "Overview" : "Read overview"}</button>`
              : ""
          }
          <a class="btn btn-primary" href="#${escapeHtml(list[0] ? list[0].id : "home")}">Start scenarios</a>
        </div>
      </div>
      ${overviewHtml}
      <div class="progress-row" style="margin-bottom:1rem" id="scenario-list-anchor">
        <div class="progress-meta">
          <span>${stats.completed}/${stats.total} complete · ${stats.masteryLabel}</span>
          <span>${stats.masteryPct}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${stats.masteryPct}%"></div></div>
      </div>
      <div class="scenario-list">${rows}</div>
    `;

    const persistOverview = (dismissed) => {
      if (!state.progress.overviewDismissed) state.progress.overviewDismissed = {};
      state.progress.overviewDismissed[moduleId] = dismissed;
      saveProgress();
    };

    const setOverviewOpen = (open) => {
      const section = $("#module-overview");
      const body = $(".module-overview-body", section);
      const toggle = $("#toggle-overview");
      if (!section) return;
      section.classList.toggle("is-open", open);
      section.classList.toggle("is-collapsed", !open);
      if (body) body.hidden = !open;
      if (toggle) toggle.textContent = open ? "Hide overview" : "Show overview";
      persistOverview(!open);
    };

    $("#toggle-overview")?.addEventListener("click", () => {
      const open = !$("#module-overview")?.classList.contains("is-open");
      setOverviewOpen(open);
    });
    $("#header-show-overview")?.addEventListener("click", () => {
      setOverviewOpen(true);
      $("#module-overview")?.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth", block: "start" });
    });
    $("#skip-to-list")?.addEventListener("click", () => {
      setOverviewOpen(false);
      $("#scenario-list-anchor")?.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth", block: "start" });
    });
    $("#begin-scenarios")?.addEventListener("click", () => {
      persistOverview(true);
    });
  }

  function renderScenario(id) {
    const scenario = findScenario(id);
    if (!scenario) {
      navigate(fallbackHash());
      return;
    }
    const challengeMode = !!(state.challenge && state.challenge.active);
    if (!state.session || state.session.scenario.id !== id || challengeMode !== state.session.challengeMode) {
      state.session = createSession(scenario, challengeMode);
    }
    paintScenario();
  }

  function paintScenario() {
    const session = state.session;
    const s = session.scenario;
    const mod = findModule(s.module);
    const hideLabels = session.challengeMode;
    const showZones =
      s.interactionType === "pitch-hotspot" ||
      s.interactionType === "drag-player" ||
      s.showTeachingZones ||
      (state.coach && s.zones);

    const scenarioForPitch = {
      ...s,
      zones: showZones || s.interactionType === "pitch-hotspot" ? s.zones : [],
    };
    // In challenge, hide teaching zone shading until answered? Brief says remove highlighted teaching zones
    if (session.challengeMode && session.stage === "decision" && s.interactionType !== "pitch-hotspot") {
      scenarioForPitch.zones = [];
    }

    const challengeHeader = session.challengeMode
      ? `<span class="step-indicator">Question ${state.challenge.index + 1} / ${state.challenge.queue.length}</span>`
      : "";

    root.innerHTML = `
      <div class="scenario-shell">
        <div class="scenario-toolbar">
          <div class="breadcrumb">
            <a href="#${escapeHtml(packHomeHash())}">${escapeHtml(packHomeLabel())}</a><span>/</span>
            <a href="#${escapeHtml(mod.hash)}">${escapeHtml(mod.title)}</a><span>/</span>
            <span>${escapeHtml(s.title)}</span>
          </div>
          ${challengeHeader}
        </div>
        <div class="coach-banner">Coach mode — answers and targets visible. Scenario ID: <code>${escapeHtml(s.id)}</code></div>
        <div class="coach-controls">
          <div class="coach-meta">correct: ${escapeHtml(String(s.correctAnswer))} | cue: ${escapeHtml(s.coachingCue || "")}</div>
          <label class="muted">Module filter
            <select id="coach-module-filter">
              <option value="">All</option>
              ${MODULES.filter((m) => !m.isChallenge && isModuleEnabled(m.id)).map((m) => `<option value="${m.id}" ${m.id === s.module ? "selected" : ""}>${escapeHtml(m.title)}</option>`).join("")}
            </select>
          </label>
          <button type="button" class="btn btn-secondary" id="coach-prev">Previous</button>
          <button type="button" class="btn btn-secondary" id="coach-next">Next</button>
          <button type="button" class="btn btn-ghost" id="coach-replay">Replay animation</button>
        </div>

        <div class="pitch-column">
          ${s.seeIt && !session.challengeMode ? `<div class="see-it"><span class="label">See it</span><p>${escapeHtml(s.seeIt)}</p></div>` : ""}
          <p class="anim-caption" id="anim-caption" hidden></p>
          <div class="pitch-wrap" id="pitch-wrap">${pitchMarkup(scenarioForPitch, { hideLabels })}</div>
        </div>

        <div class="panel-column">
          <div class="prompt-block">
            <p class="phase">${escapeHtml(s.phase || "")}</p>
            <h2>${escapeHtml(
              session.stage === "rationale"
                ? s.rationalePrompt || "Why?"
                : session.stage === "text-gate"
                  ? s.textPrompt || "Enter the code"
                  : s.prompt
            )}</h2>
          </div>
          <div class="interaction-panel" id="interaction-panel"></div>
          <div id="feedback-slot"></div>
          <div class="scenario-actions" id="scenario-actions"></div>
        </div>
      </div>
    `;

    bindPitch(s);
    renderInteraction();
    renderFeedback();
    renderScenarioActions();
    bindCoachControls();
  }

  function bindPitch(scenario) {
    const wrap = $("#pitch-wrap");
    if (!wrap) return;

    $$(".player-token", wrap).forEach((g) => {
      g.addEventListener("click", (e) => {
        e.stopPropagation();
        const role = g.getAttribute("data-role");
        const num = g.getAttribute("data-number");
        if (role) showToast(`#${num} — ${role}`);
        if (state.session.scenario.interactionType === "match-responsibilities") {
          handleMatchSelect(g.getAttribute("data-player-id"));
        }
      });
    });

    if (scenario.interactionType === "pitch-hotspot") {
      $$(".hotspot-zone", wrap).forEach((zone) => {
        const choose = () => {
          if (state.session.locked || state.session.stage !== "decision") return;
          selectDecision(zone.getAttribute("data-zone-id"));
        };
        zone.addEventListener("click", choose);
        zone.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            choose();
          }
        });
      });
    }

    if (scenario.interactionType === "drag-player") {
      setupDrag(scenario);
    }
  }

  function setupDrag(scenario) {
    const wrap = $("#pitch-wrap");
    const svg = $(".pitch-svg", wrap);
    const playerId = scenario.dragPlayerId;
    const g = $(`[data-player-id="${playerId}"]`, wrap);
    if (!g || !svg) return;

    g.classList.add("is-draggable");
    let dragging = false;

    const getPoint = (evt) => {
      const pt = svg.createSVGPoint();
      const e = evt.touches ? evt.touches[0] : evt;
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM().inverse();
      return pt.matrixTransform(ctm);
    };

    const moveToken = (x, y) => setTokenPos(g, x, y);

    const onDown = (evt) => {
      if (state.session.locked || state.session.stage !== "decision") return;
      dragging = true;
      wrap.classList.add("is-dragging");
      g.classList.add("is-dragging");
      evt.preventDefault();
    };
    const onMove = (evt) => {
      if (!dragging) return;
      evt.preventDefault();
      const p = getPoint(evt);
      const x = Math.max(2, Math.min(PW - 2, p.x));
      const y = Math.max(2, Math.min(PL - 2, p.y));
      moveToken(x, y);
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      wrap.classList.remove("is-dragging");
      g.classList.remove("is-dragging");
      const x = parseFloat(g.dataset.x || scenario.players.find((p) => p.id === playerId).x);
      const y = parseFloat(g.dataset.y || scenario.players.find((p) => p.id === playerId).y);
      evaluateDrag(x, y);
    };

    g.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function evaluateDrag(x, y) {
    const s = state.session.scenario;
    const t = s.dragTarget;
    if (!t) return;
    const dist = Math.hypot(x - t.x, y - t.y);
    const ok = dist <= (t.r || 8);
    // Also accept correct zone id if zones provided
    if (s.zones && s.correctAnswer) {
      const zone = s.zones.find((z) => z.id === s.correctAnswer);
      if (zone) {
        const inZone =
          x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
        commitDecision(inZone || ok ? s.correctAnswer : "miss", inZone || ok);
        return;
      }
    }
    commitDecision(ok ? s.correctAnswer : "miss", ok);
  }

  /* ---------- Interactions ---------- */
  function syncPromptHeader() {
    const session = state.session;
    if (!session) return;
    const s = session.scenario;
    const promptEl = $(".prompt-block h2");
    const phaseEl = $(".prompt-block .phase");
    if (!promptEl) return;

    if (session.stage === "rationale") {
      promptEl.textContent = s.rationalePrompt || "Why does that decision work?";
      if (phaseEl) phaseEl.textContent = "Explain it";
    } else if (session.stage === "complete") {
      promptEl.textContent = s.prompt;
      if (phaseEl) phaseEl.textContent = s.phase || "";
    } else {
      promptEl.textContent = s.prompt;
      if (phaseEl) phaseEl.textContent = s.phase || "";
    }
  }

  function renderInteraction() {
    const panel = $("#interaction-panel");
    if (!panel) return;
    const session = state.session;
    const s = session.scenario;
    syncPromptHeader();

    if (session.stage === "rationale") {
      const whyQ = s.rationalePrompt || "Why does that decision work?";
      panel.innerHTML = `
        <p class="step-label"><strong>Step 2 — Explain it</strong></p>
        <p class="rationale-question">${escapeHtml(whyQ)}</p>
        <div class="options-grid">
          ${session.rationaleOptions
            .map(
              (o) => `
            <button type="button" class="option-btn ${session.selectedRationale === o.id ? "is-selected" : ""}" data-rationale="${escapeHtml(o.id)}" ${session.locked && session.stage === "complete" ? "disabled" : ""}>
              ${escapeHtml(o.label)}
            </button>`
            )
            .join("")}
        </div>
      `;
      $$("[data-rationale]", panel).forEach((btn) => {
        btn.addEventListener("click", () => selectRationale(btn.getAttribute("data-rationale")));
      });
      return;
    }

    if (session.stage === "text-gate") {
      panel.innerHTML = `
        <p class="step-label"><strong>Step 2 — Pillar lock</strong></p>
        <p class="muted">${escapeHtml(s.textHint || "Type the answer, then submit.")}</p>
        <div class="text-gate">
          <input type="text" id="text-gate-input" class="text-gate-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type here" />
          <button type="button" class="btn btn-primary" id="text-gate-submit">Unlock</button>
        </div>
      `;
      const input = $("#text-gate-input");
      input?.focus();
      $("#text-gate-submit")?.addEventListener("click", submitTextGate);
      input?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitTextGate();
        }
      });
      return;
    }

    if (session.stage === "complete") {
      panel.innerHTML = "";
      return;
    }

    const step1 =
      s.rationaleOptions && s.rationaleOptions.length
        ? `<p class="step-label"><strong>Step 1 — Choose it</strong></p>`
        : "";

    switch (s.interactionType) {
      case "multiple-choice":
      case "formation-diagnosis":
        panel.innerHTML = `
          ${step1}
          <div class="options-grid">
            ${session.options
              .map(
                (o) => `
              <button type="button" class="option-btn ${session.selected === o.id ? "is-selected" : ""}" data-option="${escapeHtml(o.id)}">
                ${escapeHtml(o.label)}
              </button>`
              )
              .join("")}
          </div>`;
        $$("[data-option]", panel).forEach((btn) => {
          btn.addEventListener("click", () => selectDecision(btn.getAttribute("data-option")));
        });
        break;

      case "pitch-hotspot":
        panel.innerHTML = `${step1}<p class="muted">Tap the best zone on the pitch.${state.coach ? " (Coach: correct zone outlined.)" : ""}</p>`;
        break;

      case "drag-player":
        panel.innerHTML = `
          ${step1}
          <p class="muted">Drag #${escapeHtml(String((s.players.find((p) => p.id === s.dragPlayerId) || {}).number || ""))} to the best area — or use the buttons.</p>
          <div class="alt-actions">
            ${(s.altOptions || s.options || [])
              .map(
                (o) =>
                  `<button type="button" class="btn btn-secondary" data-option="${escapeHtml(o.id)}">${escapeHtml(o.label)}</button>`
              )
              .join("")}
          </div>`;
        $$("[data-option]", panel).forEach((btn) => {
          btn.addEventListener("click", () => selectDecision(btn.getAttribute("data-option")));
        });
        break;

      case "match-responsibilities":
        panel.innerHTML = `
          <div class="match-status" id="match-status">Select one of our players, then the opponent she should mark. Correct pairs gray out.</div>
          <div class="alt-actions" style="margin-top:0.5rem">
            <button type="button" class="btn btn-ghost" id="match-undo">Undo last pair</button>
            <button type="button" class="btn btn-primary" id="match-submit">Check matchups</button>
          </div>
          <ul id="match-pairs-list" class="muted" style="margin:0.5rem 0 0;padding-left:1.1rem"></ul>
        `;
        $("#match-undo")?.addEventListener("click", () => {
          const last = session.matchSelections.pop();
          if (last) {
            $(`[data-player-id="${last.defenderId}"]`)?.classList.remove("is-matched");
            $(`[data-player-id="${last.attackerId}"]`)?.classList.remove("is-matched");
          }
          session._matchPick = null;
          $$(".player-token").forEach((g) => g.classList.remove("is-selected"));
          updateMatchList();
          paintMatchTokens();
          $("#match-status").textContent = "Pair removed. Select one of our players, then an opponent.";
        });
        $("#match-submit")?.addEventListener("click", () => submitMatch());
        updateMatchList();
        paintMatchTokens();
        break;

      case "movement-and-pass":
        renderMovementPass(panel);
        break;

      case "ordered-decision":
        panel.innerHTML = `
          <p class="muted">Put these in the correct order.</p>
          <div class="order-list" id="order-list"></div>
          <button type="button" class="btn btn-primary" id="order-submit" style="margin-top:0.5rem">Check order</button>
        `;
        paintOrderList();
        $("#order-submit").addEventListener("click", submitOrder);
        break;

      default:
        panel.innerHTML = `<div class="options-grid">${session.options
          .map(
            (o) =>
              `<button type="button" class="option-btn" data-option="${escapeHtml(o.id)}">${escapeHtml(o.label)}</button>`
          )
          .join("")}</div>`;
        $$("[data-option]", panel).forEach((btn) => {
          btn.addEventListener("click", () => selectDecision(btn.getAttribute("data-option")));
        });
    }
  }

  function renderMovementPass(panel) {
    const session = state.session;
    const s = session.scenario;
    const runOptions = s.runOptions || (s.options || []).filter((o) => o.stage === "run");
    const passOptions = s.passOptions || (s.options || []).filter((o) => o.stage === "pass");

    if (!session.runChoice) {
      panel.innerHTML = `
        <p class="muted"><strong>Step 1 — Choose the run</strong></p>
        <div class="options-grid">
          ${shuffle(runOptions)
            .map(
              (o) =>
                `<button type="button" class="option-btn" data-run="${escapeHtml(o.id)}">${escapeHtml(o.label)}</button>`
            )
            .join("")}
        </div>`;
      $$("[data-run]", panel).forEach((btn) => {
        btn.addEventListener("click", () => {
          session.runChoice = btn.getAttribute("data-run");
          renderInteraction();
        });
      });
    } else {
      panel.innerHTML = `
        <p class="muted"><strong>Step 2 — Choose the pass</strong> (run locked: ${escapeHtml(
          (runOptions.find((o) => o.id === session.runChoice) || {}).label || session.runChoice
        )})</p>
        <div class="options-grid">
          ${shuffle(passOptions)
            .map(
              (o) =>
                `<button type="button" class="option-btn" data-pass="${escapeHtml(o.id)}">${escapeHtml(o.label)}</button>`
            )
            .join("")}
        </div>`;
      $$("[data-pass]", panel).forEach((btn) => {
        btn.addEventListener("click", () => {
          session.passChoice = btn.getAttribute("data-pass");
          const combo = `${session.runChoice}|${session.passChoice}`;
          const ok =
            session.runChoice === s.correctRun &&
            session.passChoice === s.correctPass;
          commitDecision(combo, ok);
        });
      });
    }
  }

  function paintOrderList() {
    const list = $("#order-list");
    const items = state.session.orderItems;
    list.innerHTML = items
      .map(
        (item, idx) => `
      <div class="order-item" data-idx="${idx}">
        <span class="order-rank">${idx + 1}</span>
        <div class="order-controls">
          <button type="button" aria-label="Move up" data-dir="up" ${idx === 0 ? "disabled" : ""}>▲</button>
          <button type="button" aria-label="Move down" data-dir="down" ${idx === items.length - 1 ? "disabled" : ""}>▼</button>
        </div>
        <span>${escapeHtml(item.label)}</span>
      </div>`
      )
      .join("");
    $$("[data-dir]", list).forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest(".order-item");
        const idx = parseInt(row.getAttribute("data-idx"), 10);
        const dir = btn.getAttribute("data-dir");
        const swap = dir === "up" ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= items.length) return;
        [items[idx], items[swap]] = [items[swap], items[idx]];
        paintOrderList();
      });
    });
  }

  function submitOrder() {
    const s = state.session.scenario;
    const ids = state.session.orderItems.map((i) => i.id);
    const ok = ids.join(",") === (s.correctOrder || []).join(",");
    commitDecision(ids.join(","), ok);
  }

  function matchDefenderIds(pair) {
    if (pair.defenderIds && pair.defenderIds.length) return pair.defenderIds;
    if (pair.defenderId) return [pair.defenderId];
    if (pair.playerId) return [pair.playerId];
    return [];
  }

  function matchAttackerId(pair) {
    return pair.attackerId || pair.codeId || null;
  }

  function isCorrectMatchPair(defenderId, attackerId) {
    const needed = state.session.scenario.matchPairs || [];
    return needed.some(
      (n) => matchAttackerId(n) === attackerId && matchDefenderIds(n).includes(defenderId)
    );
  }

  function isPlayerMatched(playerId) {
    const selections = state.session.matchSelections;
    if (selections.some((m) => m.defenderId === playerId)) return true;
    const neededSlots = (state.session.scenario.matchPairs || []).filter(
      (n) => matchAttackerId(n) === playerId
    ).length;
    if (neededSlots > 0) {
      const filled = selections.filter((m) => m.attackerId === playerId).length;
      return filled >= neededSlots;
    }
    return false;
  }

  function paintMatchTokens() {
    $$(".player-token").forEach((g) => {
      const id = g.getAttribute("data-player-id");
      g.classList.toggle("is-matched", isPlayerMatched(id));
    });
  }

  function shakeToken(g) {
    if (!g) return;
    const { x, y } = getTokenPos(g);
    const offsets = [0, -1.4, 1.4, -1, 1, -0.5, 0];
    let i = 0;
    const tick = () => {
      if (i >= offsets.length) {
        setTokenPos(g, x, y);
        g.classList.remove("is-wrong");
        return;
      }
      setTokenPos(g, x + offsets[i], y);
      i += 1;
      setTimeout(tick, 35);
    };
    g.classList.add("is-wrong");
    tick();
  }

  function handleMatchSelect(playerId) {
    const session = state.session;
    if (session.locked || session.stage !== "decision") return;
    const all = [].concat(session.scenario.players || [], session.scenario.opponents || []);
    const player = all.find((p) => p.id === playerId);
    if (!player) return;

    if (isPlayerMatched(playerId)) {
      showToast("That player is already matched");
      return;
    }

    $$(".player-token").forEach((g) => g.classList.remove("is-selected"));
    const el = $(`[data-player-id="${playerId}"]`);
    if (!session._matchPick) {
      if (player.team !== "ours") {
        showToast("Select one of our players first");
        return;
      }
      const assignable = (session.scenario.matchPairs || []).some((n) =>
        matchDefenderIds(n).includes(playerId)
      );
      if (!assignable) {
        showToast("That player isn’t in the key matchups for this exercise");
        return;
      }
      session._matchPick = playerId;
      el?.classList.add("is-selected");
      $("#match-status").textContent = `Selected #${player.number}. Now tap the opponent she marks.`;
    } else {
      if (player.team !== "opp") {
        showToast("Select an opponent to pair");
        return;
      }
      const defenderId = session._matchPick;
      const attackerId = playerId;
      const defEl = $(`[data-player-id="${defenderId}"]`);
      const attEl = el;

      if (!isCorrectMatchPair(defenderId, attackerId)) {
        shakeToken(defEl);
        shakeToken(attEl);
        session._matchPick = null;
        $$(".player-token").forEach((g) => g.classList.remove("is-selected"));
        $("#match-status").textContent = "Not that matchup — try again. Select one of our players first.";
        showToast("Wrong matchup");
        return;
      }

      // Correct: gray out defender; attacker grays when all her slots are filled
      session.matchSelections = session.matchSelections.filter(
        (m) => m.defenderId !== defenderId
      );
      session.matchSelections.push({ defenderId, attackerId });
      session._matchPick = null;
      $$(".player-token").forEach((g) => g.classList.remove("is-selected"));
      paintMatchTokens();
      updateMatchList();

      const needed = session.scenario.matchPairs || [];
      const done = needed.every((n) =>
        session.matchSelections.some(
          (g) => g.attackerId === matchAttackerId(n) && matchDefenderIds(n).includes(g.defenderId)
        )
      );
      if (done) {
        $("#match-status").textContent = "All key matchups set — check matchups to finish.";
      } else {
        $("#match-status").textContent = "Correct — grayed out. Select another of our players.";
      }
    }
  }

  function updateMatchList() {
    const ul = $("#match-pairs-list");
    if (!ul) return;
    const all = [].concat(
      state.session.scenario.players || [],
      state.session.scenario.opponents || []
    );
    const needed = state.session.scenario.matchPairs || [];
    ul.innerHTML = state.session.matchSelections
      .map((m) => {
        const d = all.find((p) => p.id === m.defenderId);
        const a = all.find((p) => p.id === m.attackerId);
        return `<li>Our #${d?.number} → Opp #${a?.number}</li>`;
      })
      .join("");
    const remaining = needed.length - state.session.matchSelections.length;
    if (remaining > 0) {
      ul.innerHTML += `<li class="muted">${remaining} matchup${remaining === 1 ? "" : "s"} left</li>`;
    }
  }

  function submitMatch() {
    const s = state.session.scenario;
    const needed = s.matchPairs || [];
    const got = state.session.matchSelections;
    const ok =
      needed.length > 0 &&
      needed.every((n) =>
        got.some(
          (g) => g.attackerId === matchAttackerId(n) && matchDefenderIds(n).includes(g.defenderId)
        )
      ) &&
      got.length === needed.length;
    commitDecision(JSON.stringify(got), ok);
  }

  function selectDecision(answerId) {
    if (state.session.locked || state.session.stage !== "decision") return;
    const s = state.session.scenario;
    const ok = answerId === resolveCorrectAnswer(s);
    commitDecision(answerId, ok);
  }

  function resolveCorrectAnswer(s) {
    if (s.correctAnswer != null && s.correctAnswer !== "") return s.correctAnswer;
    const hit = (s.options || []).find((o) => o.correct);
    return hit ? hit.id : undefined;
  }

  function resolveCorrectRationale(s) {
    if (s.correctRationale != null && s.correctRationale !== "") return s.correctRationale;
    const hit = (s.rationaleOptions || []).find((o) => o.correct);
    return hit ? hit.id : undefined;
  }

  function commitDecision(answerId, ok) {
    const session = state.session;
    const s = session.scenario;
    session.selected = answerId;
    session.attempts += 1;
    session.decisionCorrect = ok;

    const allowHint = !session.challengeMode;
    const gateLock = !!s.textPrompt && s.persistProgress === false;
    const reveal = ok || (!gateLock && (session.attempts >= 2 || session.challengeMode));

    if (!ok && allowHint && (session.attempts === 1 || gateLock)) {
      session.locked = false;
      paintOptionStates();
      showFeedback("hint", s.hint || "Look again at the picture — who occupies which space?");
      renderScenarioActions();
      return;
    }

    session.locked = true;
    paintOptionStates();

    if (ok && s.textPrompt) {
      session.stage = "text-gate";
      session.locked = false;
      showFeedback("correct", "Promise locked. One more lock before the play is revealed.");
      const h2 = $(".prompt-block h2");
      if (h2) h2.textContent = s.textPrompt;
      renderInteraction();
      renderScenarioActions();
      return;
    }

    if (ok && s.rationaleOptions && s.rationaleOptions.length) {
      session.stage = "rationale";
      session.locked = false;
      // Clear decision selection styling; show only the why step now
      showFeedback(
        "correct",
        "Decision locked. Now explain why that choice works."
      );
      renderInteraction();
      renderScenarioActions();
      return;
    }

    finishScenario(ok, reveal);
  }

  function submitTextGate() {
    const session = state.session;
    if (!session || session.stage !== "text-gate") return;
    const s = session.scenario;
    const input = $("#text-gate-input");
    const raw = (input?.value || "").trim();
    const expected = String(s.correctText || "").trim().toLowerCase();
    const ok = raw.toLowerCase() === expected;
    if (!ok) {
      showFeedback("hint", s.textFail || s.textHint || "Try again.");
      input?.focus();
      return;
    }
    session.revealUnlocked = true;
    finishScenario(true, true, true);
  }

  function selectRationale(id) {
    const session = state.session;
    if (session.stage !== "rationale") return;
    const s = session.scenario;
    session.selectedRationale = id;
    const ok = id === resolveCorrectRationale(s);
    session.rationaleCorrect = ok;
    session.locked = true;
    finishScenario(session.decisionCorrect, true, ok);
  }

  function finishScenario(decisionOk, reveal, rationaleOk) {
    const session = state.session;
    const s = session.scenario;
    session.stage = "complete";
    session.locked = true;

    // Progress (skip ephemeral / session-only scenarios like the corner lock)
    if (!session.challengeMode && s.persistProgress !== false) {
      const prev = getScenarioProgress(s.id);
      const first =
        prev.firstAttemptCorrect === null
          ? session.attempts === 1 && decisionOk
          : prev.firstAttemptCorrect;
      state.progress.scenarios[s.id] = {
        completed: decisionOk,
        decisionCorrect: decisionOk,
        rationaleCorrect:
          rationaleOk == null
            ? prev.rationaleCorrect || !s.rationaleOptions
            : rationaleOk,
        firstAttemptCorrect: first,
        attempts: (prev.attempts || 0) + session.attempts,
        needsReview: !decisionOk,
      };
      state.progress.lastModule = s.module;
      saveProgress();
    } else if (state.challenge) {
      state.challenge.results.push({
        id: s.id,
        concept: s.concept || s.module,
        decisionCorrect: decisionOk,
        rationaleCorrect: rationaleOk == null ? true : rationaleOk,
      });
    }

    paintOptionStates();
    const msg = decisionOk
      ? s.explanation
      : reveal
        ? s.explanation
        : s.hint;
    showFeedback(decisionOk ? "correct" : "incorrect", msg, s.coachingCue);
    renderInteraction();
    renderScenarioActions();

    if (decisionOk || reveal) {
      playAnimation(s.animationSteps || []);
    }

    // Highlight correct option
    if (reveal) {
      const correctOpt = resolveCorrectAnswer(s);
      const correctRat = resolveCorrectRationale(s);
      $$(".option-btn").forEach((btn) => {
        const id = btn.getAttribute("data-option") || btn.getAttribute("data-rationale");
        if (!id) return;
        if (id === correctOpt || id === correctRat) btn.classList.add("is-correct");
        if (
          (btn.getAttribute("data-option") === session.selected && !decisionOk) ||
          (btn.getAttribute("data-rationale") === session.selectedRationale && rationaleOk === false)
        ) {
          btn.classList.add("is-incorrect");
        }
      });
      $$(".hotspot-zone").forEach((z) => {
        if (z.getAttribute("data-zone-id") === correctOpt) z.classList.add("is-correct");
      });
    }
  }

  function paintOptionStates() {
    const session = state.session;
    $$(".option-btn").forEach((btn) => {
      const id = btn.getAttribute("data-option");
      if (id && id === session.selected) btn.classList.add("is-selected");
    });
    $$(".hotspot-zone").forEach((z) => {
      if (z.getAttribute("data-zone-id") === session.selected) z.classList.add("is-selected");
    });
  }

  function showFeedback(kind, text, cue) {
    const slot = $("#feedback-slot");
    if (!slot) return;
    const title =
      kind === "correct" ? "Strong read" : kind === "hint" ? "Hint" : "Not quite";
    slot.innerHTML = `
      <div class="feedback is-${kind}">
        <h3>${title}</h3>
        <p>${escapeHtml(text || "")}</p>
        ${
          cue && kind !== "hint"
            ? `<div class="coaching-cue"><span class="label">Remember it</span><strong>${escapeHtml(cue)}</strong></div>`
            : ""
        }
      </div>
    `;
  }

  function renderFeedback() {
    // no-op placeholder; feedback set by showFeedback
  }

  function renderScenarioActions() {
    const el = $("#scenario-actions");
    if (!el) return;
    const session = state.session;
    const s = session.scenario;
    const list = moduleScenarios(s.module);
    const idx = list.findIndex((x) => x.id === s.id);
    const next = list[idx + 1];

    if (session.challengeMode && session.stage === "complete") {
      el.innerHTML = `<button type="button" class="btn btn-primary" id="challenge-next-btn">Next</button>`;
      $("#challenge-next-btn").addEventListener("click", advanceChallenge);
      return;
    }

    const bits = [];
    if (session.stage === "complete") {
      const hasAlt = !!(s.animationStepsAlt && s.animationStepsAlt.length);
      if (hasAlt) {
        bits.push(
          `<p class="anim-next-prompt"><strong>Watch both plays:</strong> you just saw Go Long — tap <em>Watch Go Short</em> next.</p>`
        );
        bits.push(
          `<button type="button" class="btn btn-secondary" id="replay-anim">Watch Go Long again</button>`
        );
        bits.push(
          `<button type="button" class="btn btn-primary" id="replay-anim-alt">Watch Go Short →</button>`
        );
        if (next) bits.push(`<a class="btn btn-secondary" href="#${escapeHtml(next.id)}">Next scenario</a>`);
        else bits.push(`<a class="btn btn-secondary" href="#${escapeHtml(findModule(s.module).hash)}">Module complete</a>`);
      } else {
        bits.push(
          `<button type="button" class="btn btn-ghost" id="replay-anim">Replay animation</button>`
        );
        if (next) bits.push(`<a class="btn btn-primary" href="#${escapeHtml(next.id)}">Next scenario</a>`);
        else bits.push(`<a class="btn btn-primary" href="#${escapeHtml(findModule(s.module).hash)}">Module complete</a>`);
      }
      bits.push(`<a class="btn btn-secondary" href="#${escapeHtml(findModule(s.module).hash)}">Back to module</a>`);
    } else if (session.stage === "decision" && session.attempts > 0 && !session.decisionCorrect) {
      bits.push(`<p class="muted">Try another answer.</p>`);
    }
    el.innerHTML = bits.join("");
    $("#replay-anim")?.addEventListener("click", () => playAnimation(s.animationSteps || []));
    $("#replay-anim-alt")?.addEventListener("click", () => playAnimation(s.animationStepsAlt || []));
  }

  function resetPitchToScenario(scenario) {
    const all = [].concat(scenario.players || [], scenario.opponents || []);
    all.forEach((p) => {
      const g = $(`[data-player-id="${p.id}"]`);
      if (g) {
        setTokenPos(g, p.x, p.y);
        g.classList.remove("is-highlight", "is-matched", "is-selected", "is-wrong");
      }
    });
    const ball = $("#pitch-ball");
    if (ball && scenario.ball) setBallPos(ball, scenario.ball.x, scenario.ball.y);
    const animLayer = $("#pitch-anim");
    if (animLayer) animLayer.innerHTML = "";
  }

  /* ---------- Animation ---------- */
  function playAnimation(steps) {
    const generation = ++animGeneration;
    const alive = () => generation === animGeneration;
    if (!steps || !steps.length) return;
    const scenario = state.session?.scenario;
    if (scenario) resetPitchToScenario(scenario);
    const animLayer = $("#pitch-anim");
    if (!animLayer) return;
    animLayer.innerHTML = "";
    $$(".player-token").forEach((g) => g.classList.remove("is-highlight"));
    const captionEl = $("#anim-caption");
    if (captionEl) {
      captionEl.hidden = false;
      captionEl.textContent = "";
    }

    const setCaption = (step) => {
      if (!alive() || !captionEl || !step.caption) return;
      captionEl.textContent = step.caption;
    };

    const flatten = (list) => {
      list.forEach((step) => {
        if (!alive()) return;
        setCaption(step);
        if (step.type === "parallel") (step.steps || []).forEach((s) => applyAnimStep(s, true, alive));
        else applyAnimStep(step, true, alive);
      });
    };

    if (REDUCED_MOTION) {
      flatten(steps);
      return;
    }

    let i = 0;
    const run = () => {
      if (!alive() || i >= steps.length) return;
      const step = steps[i];
      setCaption(step);
      const dur = step.duration || (step.type === "parallel" ? 700 : 500);
      if (step.type === "parallel") (step.steps || []).forEach((s) => applyAnimStep(s, false, alive));
      else applyAnimStep(step, false, alive);
      i += 1;
      setTimeout(run, dur);
    };
    run();
  }

  function applyAnimStep(step, instant, alive) {
    const stillGoing = alive || (() => true);
    const animLayer = $("#pitch-anim");
    if (!animLayer) return;
    if (step.type === "parallel") {
      (step.steps || []).forEach((s) => applyAnimStep(s, instant, stillGoing));
      return;
    }
    if (step.type === "move") {
      const g = $(`[data-player-id="${step.playerId}"]`);
      if (!g) return;
      const from = getTokenPos(g);
      const toX = step.to.x;
      const toY = step.to.y;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "line");
      path.setAttribute("class", "anim-path");
      path.setAttribute("x1", from.x);
      path.setAttribute("y1", from.y);
      path.setAttribute("x2", toX);
      path.setAttribute("y2", toY);
      animLayer.appendChild(path);

      if (instant || REDUCED_MOTION) {
        setTokenPos(g, toX, toY);
        return;
      }
      const start = performance.now();
      const dur = step.duration || 500;
      const tick = (now) => {
        if (!stillGoing()) return;
        const t = Math.min(1, (now - start) / dur);
        setTokenPos(g, from.x + (toX - from.x) * t, from.y + (toY - from.y) * t);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } else if (step.type === "pass" || step.type === "ball") {
      const ball = $("#pitch-ball");
      const from = step.from || getBallPos(ball);
      const to = step.to;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("class", "anim-pass");
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
      animLayer.appendChild(line);
      if (ball) {
        if (instant || REDUCED_MOTION) {
          setBallPos(ball, to.x, to.y);
        } else {
          const start = performance.now();
          const dur = step.duration || 450;
          const x0 = from.x;
          const y0 = from.y;
          const tick = (now) => {
            if (!stillGoing()) return;
            const t = Math.min(1, (now - start) / dur);
            setBallPos(ball, x0 + (to.x - x0) * t, y0 + (to.y - y0) * t);
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      }
    } else if (step.type === "highlight") {
      (step.playerIds || []).forEach((id) => {
        $(`[data-player-id="${id}"]`)?.classList.add("is-highlight");
      });
    }
  }

  function bindCoachControls() {
    if (!state.coach) return;
    $("#coach-prev")?.addEventListener("click", () => coachNav(-1));
    $("#coach-next")?.addEventListener("click", () => coachNav(1));
    $("#coach-replay")?.addEventListener("click", () => {
      playAnimation(state.session.scenario.animationSteps || []);
    });
    $("#coach-module-filter")?.addEventListener("change", (e) => {
      const mid = e.target.value;
      const list = mid ? moduleScenarios(mid) : SCENARIOS.filter((s) => isModuleEnabled(s.module));
      if (list[0]) navigate(list[0].id);
    });
  }

  function coachNav(dir) {
    const filter = $("#coach-module-filter")?.value || "";
    const list = filter ? moduleScenarios(filter) : SCENARIOS.filter((s) => isModuleEnabled(s.module));
    const idx = list.findIndex((s) => s.id === state.session.scenario.id);
    const next = list[idx + dir];
    if (next) {
      state.session = null;
      navigate(next.id);
    }
  }

  /* ---------- Challenge ---------- */
  function renderChallenge() {
    if (state.challenge && state.challenge.active) {
      const id = state.challenge.queue[state.challenge.index];
      state.scenarioId = id;
      state.session = createSession(findScenario(id), true);
      paintScenario();
      return;
    }

    if (state.challenge && state.challenge.finished) {
      renderChallengeResults();
      return;
    }

    const qCount = CONFIG.challengeCount || 10;
    root.innerHTML = `
      <div class="section-header">
        <div>
          <h1>Mixed Challenge</h1>
          <p>${qCount} unlabeled scenarios from every module. No first-hint. Decision and rationale both count. Results by concept.</p>
        </div>
        <a class="btn btn-ghost" href="#${escapeHtml(packHomeHash())}">Modules</a>
      </div>
      <div class="results-card">
        <p class="muted">Role labels and teaching highlights are removed. Commit before you see the answer.</p>
        <div class="module-card-actions" style="margin-top:1rem">
          <button type="button" class="btn btn-primary" id="start-challenge">Start ${qCount}-question challenge</button>
        </div>
      </div>
    `;
    $("#start-challenge").addEventListener("click", startChallenge);
  }

  function startChallenge() {
    const pool = SCENARIOS.filter((s) => s.challengeEligible !== false && isModuleEnabled(s.module));
    const queue = shuffle(pool)
      .slice(0, CONFIG.challengeCount || 10)
      .map((s) => s.id);
    if (!queue.length) {
      showToast("No challenge questions in the modules that are on");
      return;
    }
    state.challenge = {
      active: true,
      finished: false,
      queue,
      index: 0,
      results: [],
    };
    state.session = null;
    navigate(queue[0]);
  }

  function advanceChallenge() {
    const ch = state.challenge;
    if (!ch) return;
    ch.index += 1;
    if (ch.index >= ch.queue.length) {
      ch.active = false;
      ch.finished = true;
      state.session = null;
      navigate("challenge");
      return;
    }
    state.session = null;
    navigate(ch.queue[ch.index]);
  }

  function renderChallengeResults() {
    const results = state.challenge.results;
    const byConcept = {};
    results.forEach((r) => {
      const key = r.concept || "general";
      if (!byConcept[key]) byConcept[key] = { hit: 0, total: 0 };
      byConcept[key].total += 1;
      if (r.decisionCorrect && r.rationaleCorrect) byConcept[key].hit += 1;
    });

    const conceptLabels = {
      transition: "Transition decisions",
      "attacking-shape": "Attacking shape",
      "wide-combinations": "Wide combinations",
      "gap-pass": "Gap passes",
      "half-space-run": "Half-space runs",
      "wide-rotation": "Wide rotations",
      "supporting-runs": "Supporting runs",
      defense: "Defensive shape",
      "defending-shape": "4-4-2 defensive shape",
      corners: "Corners",
      "corners-short": "Short corners",
      "corners-long": "Long corners",
      attack: "Attacking shape",
      wide: "Wide attack patterns",
      support: "Supporting runs",
      corner: "Corners",
      "futsal-jobs": "The four jobs",
      "futsal-zone14": "Zone 14",
      "futsal-rotation": "Rotation and rebalance",
      "futsal-keeper": "Keeper in buildup",
      "futsal-finish": "Finish the advantage",
      "futsal-diamond": "Compact diamond",
      "futsal-motion": "Diamond in motion",
      "futsal-transition": "Transitions",
    };

    const rows = Object.keys(byConcept)
      .map((k) => {
        const c = byConcept[k];
        return `<div class="concept-row"><span>${escapeHtml(conceptLabels[k] || k)}</span><strong>${c.hit}/${c.total}</strong></div>`;
      })
      .join("");

    // Recommend weakest module
    let weakest = null;
    let worst = 2;
    Object.keys(byConcept).forEach((k) => {
      const ratio = byConcept[k].hit / byConcept[k].total;
      if (ratio < worst) {
        worst = ratio;
        weakest = k;
      }
    });
    const modMap = {
      transition: "attack",
      "attacking-shape": "attack",
      attack: "attack",
      "wide-combinations": "wide",
      "gap-pass": "wide",
      "half-space-run": "wide",
      "wide-rotation": "wide",
      wide: "wide",
      defense: "defense",
      "defending-shape": "defense",
      corners: "corner",
      "corners-short": "corner",
      "corners-long": "corner",
      corner: "corner",
      "futsal-jobs": "futsal-jobs",
      "futsal-zone14": "futsal-zone14",
      "futsal-rotation": "futsal-rotation",
      "futsal-keeper": "futsal-keeper",
      "futsal-finish": "futsal-finish",
      "futsal-diamond": "futsal-diamond",
      "futsal-motion": "futsal-motion",
      "futsal-transition": "futsal-transitions",
    };
    const reviewId = modMap[weakest] || (MODULES.find((m) => !m.isChallenge) || {}).id;
    const reviewMod = findModule(reviewId) || MODULES.find((m) => !m.isChallenge);

    const totalHit = results.filter((r) => r.decisionCorrect && r.rationaleCorrect).length;

    root.innerHTML = `
      <div class="section-header">
        <div>
          <h1>Challenge results</h1>
          <p>${totalHit}/${results.length} fully correct (decision + rationale).</p>
        </div>
      </div>
      <div class="results-card">
        <div class="concept-scores">${rows}</div>
        <div class="recommend">Review next: <strong>${escapeHtml(reviewMod.title)}</strong> — strengthen the concepts that slipped.</div>
        <div class="module-card-actions" style="margin-top:1rem">
          <a class="btn btn-primary" href="#${escapeHtml(reviewMod.hash)}">Open ${escapeHtml(reviewMod.title)}</a>
          <button type="button" class="btn btn-secondary" id="retry-challenge">Try again</button>
          <a class="btn btn-ghost" href="#${escapeHtml(packHomeHash())}">Modules</a>
        </div>
      </div>
    `;
    state.progress.challengeAttempts.push({
      at: Date.now(),
      score: totalHit,
      total: results.length,
    });
    saveProgress();
    $("#retry-challenge").addEventListener("click", () => {
      state.challenge = null;
      startChallenge();
    });
  }

  /* ---------- Chrome: drawer, settings ---------- */
  function openDrawer(open) {
    const drawer = $("#nav-drawer");
    const btn = $("#menu-btn");
    state.drawerOpen = open;
    if (open) {
      drawer.hidden = false;
      requestAnimationFrame(() => drawer.classList.add("is-open"));
      btn.setAttribute("aria-expanded", "true");
    } else {
      drawer.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      setTimeout(() => {
        if (!state.drawerOpen) drawer.hidden = true;
      }, 220);
    }
  }

  $("#menu-btn")?.addEventListener("click", () => openDrawer(!state.drawerOpen));
  $$("[data-close-drawer]").forEach((el) =>
    el.addEventListener("click", () => openDrawer(false))
  );

  // Desktop flyouts: click toggle for touch; hover/focus-within via CSS
  $$("[data-flyout]").forEach((fly) => {
    const trigger = $(".nav-flyout-trigger", fly);
    if (!trigger || trigger.tagName === "A") return;
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      const open = !fly.classList.contains("is-open");
      $$("[data-flyout]").forEach((f) => f.classList.remove("is-open"));
      $$(".nav-flyout-trigger[aria-expanded]").forEach((t) => t.setAttribute("aria-expanded", "false"));
      if (open) {
        fly.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-flyout]")) {
      $$("[data-flyout]").forEach((f) => f.classList.remove("is-open"));
      $$(".nav-flyout-trigger[aria-expanded]").forEach((t) => t.setAttribute("aria-expanded", "false"));
    }
  });

  const settingsModal = $("#settings-modal");
  $("#settings-btn")?.addEventListener("click", () => {
    settingsModal.hidden = false;
  });
  $("#open-admin-btn")?.addEventListener("click", () => {
    settingsModal.hidden = true;
    if ((location.hash || "").replace(/^#/, "") === "admin") render();
    else navigate("admin");
  });
  $("#area-switch-select")?.addEventListener("change", (e) => {
    const hash = e.target.value;
    if (hash) navigate(hash);
  });
  $$("[data-close-settings]").forEach((el) =>
    el.addEventListener("click", () => {
      settingsModal.hidden = true;
    })
  );
  $("#reset-progress-btn")?.addEventListener("click", () => {
    if (confirm("Reset all saved progress on this device?")) {
      state.progress = defaultProgress();
      saveProgress();
      settingsModal.hidden = true;
      render();
      showToast("Progress reset");
    }
  });
  window.addEventListener("hashchange", () => {
    const route = parseHash();
    if (route.view !== "scenario") {
      if (!(state.challenge && state.challenge.active && route.view === "challenge")) {
        // keep challenge state
      }
      if (route.view !== "scenario") state.session = null;
    } else if (state.session && state.session.scenario.id !== route.scenarioId) {
      state.session = null;
    }
    render();
  });

  // Boot
  render();
})();
