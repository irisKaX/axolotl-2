import { icon } from './icons.js';
export function el(tag, className = '', text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function button(text, onClick, { kind = 'secondary', iconName, id } = {}) {
  const node = el('button', 'button ' + kind);
  node.type = 'button';
  if (id) node.id = id;
  if (iconName) node.append(icon(iconName));
  node.append(el('span', '', text));
  if (onClick) node.addEventListener('click', onClick);
  return node;
}
export function emptyState(iconName, title, description) {
  const box = el('div', 'empty-state');
  const symbol = toolMascot(iconName, 'empty-icon');
  box.append(symbol, el('h3', '', title), el('p', 'muted', description));
  return box;
}
export function toolMascot(badgeIcon = '', className = '') {
  const mascot = el('span', 'tool-mascot ' + className),
    face = el('span', 'tool-mascot-face'),
    image = el('img');
  mascot.setAttribute('aria-hidden', 'true');
  image.src = '../assets/axolotls/converter-face.png';
  image.alt = '';
  image.width = image.height = 1254;
  image.decoding = 'async';
  face.append(image);
  mascot.append(face);
  if (badgeIcon) {
    const badge = el('span', 'tool-mascot-badge');
    badge.append(icon(badgeIcon));
    mascot.append(badge);
  }
  return mascot;
}
export function labelCheck(text, checked = true) {
  const label = el('label', 'check-label');
  const input = el('input');
  input.type = 'checkbox';
  input.checked = checked;
  label.append(input, document.createTextNode(text));
  return { label, input };
}
export function notice(box, text, kind = 'info') {
  box.className = 'notice ' + kind;
  box.textContent = text;
  box.hidden = !text;
}
export function sectionHeader(title, description) {
  const header = el('header', 'tool-heading');
  header.append(el('h1', '', title), el('p', '', description));
  return header;
}
export function helpDetails(title, ...content) {
  const details = el('details', 'tool-help'),
    body = el('div', 'tool-help-content');
  details.append(el('summary', '', title));
  for (const item of content) body.append(typeof item === 'string' ? el('p', '', item) : item);
  details.append(body);
  return details;
}
export function chip(text, kind = '') {
  return el('span', 'chip ' + kind, text);
}
export async function copyText(value) {
  if (!navigator.clipboard?.writeText)
    throw new Error('Prohlížeč nepovoluje zápis do schránky. Označte a zkopírujte hodnotu ručně.');
  await navigator.clipboard.writeText(value);
}
export function downloadLink(url, text) {
  const a = el('a', 'text-link', text);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
