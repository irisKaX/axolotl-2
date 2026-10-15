(() => {
  const navigation = document.getElementById('axolotl-navigation');
  const workspace = document.getElementById('axolotl-workspace');
  const groups = [...navigation.querySelectorAll('.axolotl-nav-group')].map(element => ({
    element,
    trigger: element.querySelector('.axolotl-nav-trigger'),
    panel: element.querySelector('.axolotl-nav-dropdown'),
    links: [...element.querySelectorAll('.axolotl-nav-link')]
  }));
  const links = [...navigation.querySelectorAll('a[data-axolotl-route]')];
  const views = [...workspace.querySelectorAll('.axolotl-view')];
  const hoverPointer = matchMedia('(hover: hover) and (pointer: fine)');
  let openGroup = null;
  let openedByHover = false;
  let closeTimer;

  function closeNavigation() {
    clearTimeout(closeTimer);
    if (!openGroup) return;
    openGroup.trigger.setAttribute('aria-expanded', 'false');
    openGroup.panel.hidden = true;
    openGroup = null;
    openedByHover = false;
  }

  function openNavigation(group, fromHover = false) {
    clearTimeout(closeTimer);
    if (openGroup === group) return;
    closeNavigation();
    openGroup = group;
    openedByHover = fromHover;
    group.panel.hidden = false;
    group.trigger.setAttribute('aria-expanded', 'true');
    document.dispatchEvent(new Event('axolotl:navigation-open'));
  }

  for (const group of groups) {
    group.element.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && hoverPointer.matches) openNavigation(group, true);
    });
    group.element.addEventListener('pointerleave', () => {
      closeTimer = setTimeout(() => {
        if (openGroup === group && !group.panel.contains(document.activeElement)) closeNavigation();
      }, 150);
    });
    group.trigger.addEventListener('click', () => {
      if (openGroup === group && openedByHover) {
        openedByHover = false;
      } else if (openGroup === group) {
        closeNavigation();
      } else {
        openNavigation(group);
      }
    });
    group.trigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openNavigation(group);
        group.links[event.key === 'ArrowDown' ? 0 : group.links.length - 1].focus();
      }
    });
    group.panel.addEventListener('keydown', event => {
      const index = group.links.indexOf(document.activeElement);
      if (index < 0) return;
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % group.links.length;
      if (event.key === 'ArrowUp') next = (index + group.links.length - 1) % group.links.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = group.links.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        group.links[next].focus();
      }
    });
    group.element.addEventListener('focusout', () => {
      setTimeout(() => {
        if (openGroup === group && !group.element.contains(document.activeElement)) closeNavigation();
      }, 0);
    });
  }

  navigation.addEventListener('keydown', event => {
    if (event.key === 'Escape' && openGroup) {
      event.preventDefault();
      const trigger = openGroup.trigger;
      closeNavigation();
      trigger.focus();
    }
  });
  document.addEventListener('axolotl:settings-open', closeNavigation);
  document.addEventListener('axolotl:tabs-open', closeNavigation);
  document.addEventListener('pointerdown', event => {
    if (!navigation.contains(event.target)) closeNavigation();
  });

  function renderRoute(route = location.hash.slice(1) || 'dashboard') {
    const active = views.find(view => view.dataset.axolotlRoute === route) || views[0];
    for (const view of views) view.hidden = view !== active;
    workspace.setAttribute('aria-label', active.getAttribute('aria-label'));
    document.title = active.dataset.axolotlRoute === 'dashboard'
      ? 'Axolotl 2.0'
      : active.getAttribute('aria-label') + ' · Axolotl 2.0';
    for (const link of links) {
      if (link.dataset.axolotlRoute === active.dataset.axolotlRoute) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    for (const group of groups) {
      group.trigger.dataset.axolotlActive = String(group.links.some(link => link.hasAttribute('aria-current')));
    }
  }

  for (const link of links) {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      renderRoute(link.dataset.axolotlRoute);
      closeNavigation();
      workspace.focus({ preventScroll: true });
    });
  }
  window.addEventListener('hashchange', () => {
    renderRoute();
    closeNavigation();
  });
  renderRoute();
})();
