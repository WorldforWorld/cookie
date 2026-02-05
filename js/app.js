/* Helpers */
const byCategorySelector = (cat) =>
  `script[type="text/plain"][data-category="${cat}"]`;
const loadScriptFromNode = (node) => {
  if (node.dataset.src) {
    const s = document.createElement("script");
    s.src = node.dataset.src;
    s.async = true;
    s.dataset.injectedBy = "cmp";
    document.head.appendChild(s);
    return s;
  } else {
    const s = document.createElement("script");
    s.textContent = node.textContent;
    s.dataset.injectedBy = "cmp";
    document.head.appendChild(s);
    return s;
  }
};

const CM = {
  loaded: { analytics: false, ads: false, functional: false },
  injectedNodes: [],
  loadCategory(cat) {
    if (this.loaded[cat]) return;
    document.querySelectorAll(byCategorySelector(cat)).forEach((node) => {
      const injected = loadScriptFromNode(node);
      this.injectedNodes.push(injected);
    });
    this.loaded[cat] = true;
    console.log("CM loaded", cat);
  },
  apply(consent) {
    if (consent.analytics) this.loadCategory("analytics");
    if (consent.ads) this.loadCategory("ads");
    if (consent.functional) this.loadCategory("functional");
  },
  save(consent) {
    localStorage.setItem("cookieConsentV1", JSON.stringify(consent));
  },
  read() {
    try {
      return JSON.parse(localStorage.getItem("cookieConsentV1"));
    } catch (e) {
      return null;
    }
  },
  revoke() {
    this.injectedNodes.forEach(
      (n) => n && n.parentNode && n.parentNode.removeChild(n),
    );
    this.injectedNodes = [];
    this.loaded = { analytics: false, ads: false, functional: false };
    try {
      delete window.ym;
    } catch (e) {}
    try {
      delete window._tmr;
    } catch (e) {}
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie =
        name +
        "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" +
        location.hostname;
    });
    localStorage.removeItem("cookieConsentV1");
    console.log("CM: revoked");
  },
};

/* UI hookup */
const cookieEl = document.getElementById("cookieCMP");
const barEl = document.getElementById("cookieBar");
const openBtn = document.getElementById("openPanel");
const collapseBtn = document.getElementById("collapse");
const acceptAllBtn = document.getElementById("acceptAll");
const saveBtn = document.getElementById("saveSettings");
const revokeBtn = document.getElementById("revoke");

function hideBar() {
  // прячем компактную плашку (display:flex -> none)
  barEl.style.display = "none";
}
function showBar() {
  // возвращаем её в исходное состояние
  barEl.style.display = "flex";
}

/* открытие панели: скрываем bar и показываем panel */
openBtn.addEventListener("click", () => {
  cookieEl.classList.remove("is-compact");
  hideBar();
});

/* сворачивание стрелкой: показываем bar снова */
collapseBtn.addEventListener("click", () => {
  cookieEl.classList.add("is-compact");
  showBar();
});

/* аккордеон +/- */
function setGroupState(groupEl, open) {
  if (open) {
    groupEl.classList.add("is-open");
    groupEl.querySelector(".group__head").setAttribute("aria-expanded", "true");
    const icon = groupEl.querySelector(".group__icon");
    if (icon) icon.textContent = "−";
  } else {
    groupEl.classList.remove("is-open");
    groupEl
      .querySelector(".group__head")
      .setAttribute("aria-expanded", "false");
    const icon = groupEl.querySelector(".group__icon");
    if (icon) icon.textContent = "+";
  }
}
document.querySelectorAll("[data-group]").forEach((group) => {
  const head = group.querySelector(".group__head");
  const initiallyOpen = group.classList.contains("is-open");
  setGroupState(group, initiallyOpen);
  head.addEventListener("click", () =>
    setGroupState(group, !group.classList.contains("is-open")),
  );
  head.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      head.click();
    }
  });
});

/* accept / save / revoke */
acceptAllBtn.addEventListener("click", () => {
  const consent = { analytics: true, ads: true, functional: true };
  CM.save(consent);
  CM.apply(consent);
  cookieEl.style.display = "none";
});

saveBtn.addEventListener("click", () => {
  const consent = {
    analytics: !!document.querySelector('[name="analytics"]').checked,
    ads: !!document.querySelector('[name="ads"]').checked,
    functional: true,
  };
  CM.save(consent);
  CM.apply(consent);
  cookieEl.style.display = "none";
});

revokeBtn.addEventListener("click", () => {
  CM.revoke();
  cookieEl.classList.add("is-compact");
  cookieEl.style.display = "";
  showBar();
});

/* Авто-применение сохранённого согласия */
window.addEventListener("DOMContentLoaded", () => {
  const saved = CM.read();
  if (saved) {
    CM.apply(saved);
    cookieEl.style.display = "none";
  } else {
    // убедимся, что bar видно по умолчанию
    showBar();
  }
});
