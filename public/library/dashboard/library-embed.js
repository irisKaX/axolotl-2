// This is the canonical embedded specimen, not a second public catalog.
const libraryUrl = new URL('../../?catalog=library&section=dashboard#design-system', location.href);
if (window.top === window.self) location.replace(libraryUrl.href);
document.addEventListener('click', event => {
  const link = event.target.closest?.('a[href="#design-system"]');
  if (!link) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  window.parent.location.href = new URL('../../?catalog=library#design-system', location.href).href;
}, true);
