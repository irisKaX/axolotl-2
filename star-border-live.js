/* Compatibility layer for branch-based GitHub Pages root deployment.
   Source implementation lives in src/pages/DesignSystem.tsx. */
(() => {
  const colorDefault = "#6699ff";
  function mount() {
    const tabs = document.querySelector(".axolotl-design-tabs");
    if (!tabs || tabs.querySelector('[id="axolotl-design-tab-buttons"]')) return;
    const basePanel = document.querySelector(".axolotl-design-panel");
    if (!basePanel) return;
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = "axolotl-design-tab-buttons";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", "false");
    tab.setAttribute("aria-controls", "axolotl-compat-buttons");
    tab.tabIndex = -1;
    tab.textContent = "Tlačítka";
    const panel = document.createElement("section");
    panel.id = "axolotl-compat-buttons";
    panel.className = "axolotl-design-panel axolotl-compat-buttons";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.hidden = true;
    panel.innerHTML = '<section class="axolotl-component-block axolotl-star-demo"><div class="axolotl-star-heading"><div><span class="axolotl-eyebrow">React Bits · Animation</span><h2>Star Border</h2><p>Animovaný světelný oběh kolem tlačítka.</p></div><a href="https://reactbits.dev/animations/star-border" target="_blank" rel="noopener noreferrer">Zdroj ↗</a></div><div class="axolotl-star-stage"><button type="button" class="axolotl-star-border"><span>Vyzkoušet Star Border ✦</span></button><span class="axolotl-card-muted" role="status">Klikni na tlačítko.</span></div><div class="axolotl-star-controls"><label class="axolotl-field">Barva světla <input type="color" value="#6699ff"></label><label class="axolotl-field">Doba oběhu: <output>3.0 s</output><input type="range" min="1" max="8" step="0.5" value="3"></label></div></section>';
    const star = panel.querySelector(".axolotl-star-border");
    const color = panel.querySelector('input[type="color"]');
    const speed = panel.querySelector('input[type="range"]');
    const output = panel.querySelector("output");
    const status = panel.querySelector('[role="status"]');
    star.style.setProperty("--star-color", colorDefault);
    let clicks = 0;
    star.addEventListener("click", () => { status.textContent = "Kliknutí: " + (++clicks); });
    color.addEventListener("input", () => star.style.setProperty("--star-color", color.value));
    speed.addEventListener("input", () => { output.textContent = Number(speed.value).toFixed(1) + " s"; star.style.setProperty("--star-duration", speed.value + "s"); });
    tab.addEventListener("click", () => {
      for (const original of tabs.querySelectorAll('[role="tab"]')) {
        original.setAttribute("aria-selected", String(original === tab));
        original.tabIndex = original === tab ? 0 : -1;
      }
      basePanel.hidden = true;
      panel.hidden = false;
    });
    tabs.addEventListener("click", event => {
      const target = event.target.closest('[role="tab"]');
      if (target && target !== tab) {
        basePanel.hidden = false;
        panel.hidden = true;
        tab.setAttribute("aria-selected", "false");
        tab.tabIndex = -1;
      }
    });
    tabs.addEventListener("keydown", event => {
      if (!["ArrowRight","ArrowLeft","Home","End"].includes(event.key)) return;
      if (document.activeElement === tab) {
        if (event.key === "ArrowLeft" || event.key === "Home") {
          event.preventDefault();
          const previous = tab.previousElementSibling;
          if (previous) previous.click(), previous.focus();
        }
      } else if (document.activeElement === tab.previousElementSibling && (event.key === "ArrowRight" || event.key === "End")) {
        event.preventDefault();
        tab.click();
        tab.focus();
      }
    }, true);
    tabs.appendChild(tab);
    basePanel.after(panel);
  }
  const observer = new MutationObserver(() => mount());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();