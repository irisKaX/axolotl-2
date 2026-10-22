import s from '../../app/header/header.module.css';
// Address the existing CSS module classes without copying or changing AppHeader.
const scoped = (rule:string) => rule.replace(/^([^{}]+)\{/, (_, selectors: string) => selectors.split(',').map(selector => `html[data-axolotl-library] ${selector.trim()}`).join(',') + '{');
export const headerThemeStylesheet = [
  scoped(`.${s.scope}.${s.panel} [data-navigation=desktop] .${s.row}[aria-current=page] {background:var(--primary);color:var(--primary-foreground);}`),
  scoped(`.${s.scope}.${s.panel} [data-navigation=desktop] .${s.row}[aria-current=page] .${s.check} {display:block;}`),
  scoped(`.${s.scope} .${s.selectTrigger}, .${s.scope} .${s.checkField} input, .${s.scope} .${s.themeTrack} {border-color:var(--input);}`),
  scoped(`.${s.scope} .${s.selectOption}:focus-visible {outline-color:currentColor;}`),
  scoped(`.${s.control}[aria-expanded=true], .${s.menuTrigger}[aria-expanded=true], .${s.tabsTrigger}[aria-expanded=true] {color:var(--primary-foreground);}`),
  scoped(`.${s.scope} .${s.row}[aria-pressed=true] small {color:var(--primary-foreground);}`),
  scoped(`.${s.scope} .${s.url} {box-shadow:var(--shadow-xs);}`),
  scoped(`.${s.scope} .${s.themeOrb} {box-shadow:var(--shadow-xs);}`),
  scoped(`.${s.scope} .${s.themeOrb}::after {background:var(--primary-foreground);box-shadow:0 -7px 0 -4px var(--primary-foreground),0 7px 0 -4px var(--primary-foreground),-7px 0 0 -4px var(--primary-foreground),7px 0 0 -4px var(--primary-foreground),-5px -5px 0 -4px var(--primary-foreground),5px 5px 0 -4px var(--primary-foreground),-5px 5px 0 -4px var(--primary-foreground),5px -5px 0 -4px var(--primary-foreground);}`),
  scoped(`.${s.scope} .${s.theme} input:checked + .${s.themeTrack} .${s.themeOrb}::after {background:transparent;box-shadow:3px 3px 0 0 var(--primary-foreground);}`),
  scoped(`.${s.scope} .${s.selectOption}[data-state=checked] {background:var(--primary);color:var(--primary-foreground);}`),
  scoped(`.${s.scope} .${s.selectOption}[data-highlighted]:not([data-state=checked]) {background:var(--accent);color:var(--accent-foreground);}`),
].join('\n');
