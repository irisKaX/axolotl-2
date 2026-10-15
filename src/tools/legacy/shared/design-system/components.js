import { el } from '../ui.js';

// Approved SVG artwork, shared with the catalog. Never insert a filename as HTML.
const artwork = {
  'crop':
    '<svg class="ds-action__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M6 3v13a2 2 0 0 0 2 2h13"/><path class="ds-action__moving" d="M3 6h13a2 2 0 0 1 2 2v13"/></svg>',
  'search':
    '<svg class="ds-action__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
  'close':
    '<svg class="ds-action__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g class="ds-action__moving"><path d="m6 6 12 12M18 6 6 18"/></g></svg>',
  'open':
    '<svg class="ds-action__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><g class="ds-action__moving"><path d="M13 4h7v7m0-7-9 9"/></g></svg>',
  'save':
    '<svg class="ds-action__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M5 3h12l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2Z"/><path d="M7 3v6h9V3"/><g class="ds-action__moving"><path d="M7 19v-6h10v6"/><path d="M14 5v2"/></g></svg>',
  'copy':
    '<svg class="ds-action__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M8 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3"/><rect class="ds-action__moving" x="8" y="8" width="13" height="13" rx="2"/></svg>',
  'cloud-upload':
    '<svg class="ds-action__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M6.5 18H6a4.5 4.5 0 0 1-.7-8.94A6.5 6.5 0 0 1 18 8a5 5 0 0 1 .5 9.98"/><g class="ds-action__moving"><path d="M12 20v-9m-3 3 3-3 3 3"/></g></svg>',
  'upload':
    '<svg class="ds-action__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/><g class="ds-action__moving"><path d="M12 15V3m-5 5 5-5 5 5"/></g></svg>',
  'delete':
    '<svg class="ds-action__bin-top" viewBox="0 0 39 7" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><line y1="5" x2="39" y2="5" stroke="currentColor" stroke-width="4"></line><line x1="12" y1="1.5" x2="26.0357" y2="1.5" stroke="currentColor" stroke-width="3"></line></svg>\n<svg class="ds-action__bin-bottom" viewBox="0 0 33 39" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><mask id="ds-bin-mask-sample" fill="white"><path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"></path></mask><path d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z" fill="currentColor" mask="url(#ds-bin-mask-sample)"></path><path d="M12 6L12 29M21 6V29" stroke="currentColor" stroke-width="4"></path></svg>',
  'delete-all':
    '<svg class="ds-action__trash" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>',
  'export':
    '<svg class="ds-action__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M5 15v5h14v-5"></path><g class="ds-action__moving"><path d="M12 15V4m-4 4 4-4 4 4"></path></g></svg>',
  'preview':
    '<svg class="ds-action__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"></path><circle class="ds-action__moving" cx="12" cy="12" r="2.8"></circle></svg>'
};
let nextMaskId = 0;

/** Icon action with a native button, accessible name, and unique SVG mask. */
export function actionButton(kind, label, onClick, { id } = {}) {
  const node = el('button');
  node.type = 'button';
  styleActionButton(node, kind, label);
  if (id) node.id = id;
  if (onClick) node.addEventListener('click', onClick);
  return node;
}

/** Text action using the same approved artwork as its circular counterpart. */
export function labeledActionButton(kind, label, onClick, options = {}) {
  const node = actionButton(kind, label, onClick, options);
  node.classList.add('ds-action--labeled');
  node.append(el('span', 'ds-action__label', label));
  return node;
}

/** Apply approved artwork to an existing button without replacing its listeners. */
export function styleActionButton(node, kind, label) {
  if (!Object.hasOwn(artwork, kind)) throw new Error('Unknown action button: ' + kind);
  node.classList.remove('button', 'icon-button', 'primary', 'secondary', 'ghost');
  node.classList.add('ds-action', 'ds-action--' + kind);
  node.setAttribute('aria-label', label);
  node.title = label;
  if (kind === 'delete-all') node.dataset.label = 'Vymazat vše';
  const maskId = 'ds-bin-mask-runtime-' + ++nextMaskId;
  node.innerHTML = artwork[kind].replaceAll('ds-bin-mask-sample', maskId);
  return node;
}

/** Decorative animation; the surrounding task supplies its accessible status. */
export function banterLoader() {
  const node = el('div', 'ds-banter-loader');
  node.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 9; i++) node.append(el('div', 'ds-banter-loader__box'));
  return node;
}
