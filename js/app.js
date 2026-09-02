// Small app shell: page routing, the DE/EN toggle and the intro splash.
// No framework and no build step — plain DOM updates driven by one state
// object, using the same `data-active="true"` attribute pattern the CSS
// already uses for the scenario chips.

(() => {
  const state = {
    view: "home", // "home" | "werdegang" | "projekte" | "kontakt"
    lang: "de", // "de" | "en"
    scenario: "Melaten", // "Melaten" | "Aachen" | "Jackerath"
  };

  const introOverlay = document.querySelector(".intro-overlay");
  const views = document.querySelectorAll(".view");
  const navLinks = document.querySelectorAll("[data-view-link]");
  const langButtons = document.querySelectorAll("[data-lang-btn]");
  const scenarioChips = document.querySelectorAll("[data-set-scenario]");
  const scenarioCaptions = document.querySelectorAll("[data-scenario-caption]");
  const scenarioElements = document.querySelectorAll("scenario-map, prr-surface");
  const footer = document.querySelector(".site-footer");

  // -- translation --
  // Static content is translated declaratively: any element carrying
  // data-en (plain text), data-en-html (nested markup), data-en-alt or
  // data-en-aria-label is swapped between its original German content
  // (captured once, on first run) and that English value. Custom
  // elements with their own JS-generated German strings (car-net,
  // scenario-map, github-contrib, prr-surface) expose a setLang(lang)
  // method instead, called below.
  const textNodes = document.querySelectorAll("[data-en]");
  const htmlNodes = document.querySelectorAll("[data-en-html]");
  const altNodes = document.querySelectorAll("[data-en-alt]");
  const ariaNodes = document.querySelectorAll("[data-en-aria-label]");
  const translatableElements = document.querySelectorAll(
    "car-net, scenario-map, github-contrib, prr-surface"
  );

  textNodes.forEach((el) => {
    if (el.dataset.de === undefined) el.dataset.de = el.textContent;
  });
  htmlNodes.forEach((el) => {
    if (el.dataset.deHtml === undefined) el.dataset.deHtml = el.innerHTML;
  });
  altNodes.forEach((el) => {
    if (el.dataset.deAlt === undefined) el.dataset.deAlt = el.alt;
  });
  ariaNodes.forEach((el) => {
    if (el.dataset.deAriaLabel === undefined) {
      el.dataset.deAriaLabel = el.getAttribute("aria-label") || "";
    }
  });

  function setView(view) {
    state.view = view;

    views.forEach((section) => {
      section.setAttribute("data-active", String(section.dataset.view === view));
    });
    navLinks.forEach((link) => {
      link.setAttribute("data-active", String(link.dataset.viewLink === view));
    });
    if (footer) {
      footer.hidden = view === "home";
    }

    window.scrollTo(0, 0);
  }

  function setLang(lang) {
    state.lang = lang;
    document.documentElement.setAttribute("lang", lang);
    langButtons.forEach((btn) => {
      btn.setAttribute("data-active", String(btn.dataset.langBtn === lang));
    });

    const en = lang === "en";
    textNodes.forEach((el) => {
      el.textContent = en ? el.dataset.en : el.dataset.de;
    });
    htmlNodes.forEach((el) => {
      el.innerHTML = en ? el.dataset.enHtml : el.dataset.deHtml;
    });
    altNodes.forEach((el) => {
      el.alt = en ? el.dataset.enAlt : el.dataset.deAlt;
    });
    ariaNodes.forEach((el) => {
      el.setAttribute("aria-label", en ? el.dataset.enAriaLabel : el.dataset.deAriaLabel);
    });
    translatableElements.forEach((el) => {
      if (typeof el.setLang === "function") el.setLang(lang);
    });
  }

  function setScenario(scenario) {
    state.scenario = scenario;
    scenarioChips.forEach((chip) => {
      chip.setAttribute("data-active", String(chip.dataset.setScenario === scenario));
    });
    scenarioCaptions.forEach((caption) => {
      caption.setAttribute("data-active", String(caption.dataset.scenarioCaption === scenario));
    });
    scenarioElements.forEach((el) => el.setAttribute("scenario", scenario));
  }

  // Delegate every click so we don't need a listener per element.
  document.addEventListener("click", (event) => {
    const navTarget = event.target.closest("[data-nav]");
    if (navTarget) {
      event.preventDefault();
      setView(navTarget.dataset.nav);
      return;
    }

    const langTarget = event.target.closest("[data-lang-btn]");
    if (langTarget) {
      event.preventDefault();
      setLang(langTarget.dataset.langBtn);
      return;
    }

    const scenarioTarget = event.target.closest("[data-set-scenario]");
    if (scenarioTarget) {
      event.preventDefault();
      setScenario(scenarioTarget.dataset.setScenario);
    }
  });

  // Splash screen: shown briefly on load, then faded out.
  if (introOverlay) {
    setTimeout(() => introOverlay.setAttribute("data-state", "exit"), 1800);
    setTimeout(() => introOverlay.setAttribute("data-state", "done"), 2400);
  }

  setView(state.view);
  setLang(state.lang);
  setScenario(state.scenario);
})();
