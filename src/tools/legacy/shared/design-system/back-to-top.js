/** A static catalogue sample using the same button and artwork as the floating control. */
export function backToTopButton(onClick) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'ds-back-to-top ds-back-to-top--sample';
  element.setAttribute('aria-label', 'Zpět nahoru');
  element.title = 'Zpět nahoru';
  element.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>';
  if (onClick) element.addEventListener('click', onClick);
  return element;
}

/** Mount one page-level control; destroy it when its host view is released. */
export function createBackToTop({ target = document.body, focusTarget } = {}) {
  const doc = target.ownerDocument;
  const view = doc.defaultView;
  const element = backToTopButton();
  element.classList.remove('ds-back-to-top--sample');
  element.hidden = true;
  let destroyed = false;

  function focusTop() {
    const destination = focusTarget || doc.querySelector('main') || doc.body;
    // Keep the destination focusable: removing tabindex immediately can blur it.
    if (!destination.hasAttribute('tabindex')) destination.setAttribute('tabindex', '-1');
    destination.focus({ preventScroll: true });
  }

  function update() {
    if (destroyed) return;
    const visible = view.scrollY > 400;
    if (!visible && doc.activeElement === element) focusTop();
    element.hidden = !visible;
  }

  function goToTop() {
    focusTop();
    view.scrollTo({
      top: 0,
      left: 0,
      behavior: view.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  }

  element.addEventListener('click', goToTop);
  view.addEventListener('scroll', update, { passive: true });
  view.addEventListener('resize', update);
  target.append(element);
  update();

  return {
    element,
    update,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      view.removeEventListener('scroll', update);
      view.removeEventListener('resize', update);
      element.removeEventListener('click', goToTop);
      if (doc.activeElement === element) focusTop();
      element.remove();
    }
  };
}
