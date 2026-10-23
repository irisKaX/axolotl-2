import source from './tweakcn.export.css?raw';
import corrections from './contrast-corrections.json';
export type ThemeMode = 'light' | 'dark';
export type ThemeTokens = Record<`--${string}`, string>;
function declarations(block: string): ThemeTokens {
  return Object.fromEntries(Array.from(block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g), m => [m[1], m[2].trim()]));
}
// Preserve the complete export as provenance. Tailwind-only directives stay
// local; existing React components consume the single resolved registry below.
const light = declarations(source.match(/:root\s*\{([^}]+)\}/)![1]);
const dark = {...light, ...declarations(source.match(/\.dark\s*\{([^}]+)\}/)![1])};
export const originalThemeTokens: Record<ThemeMode, ThemeTokens> = {light, dark};
// One resolved registry. Original user export remains byte-for-byte auditable.
export const themeTokens: Record<ThemeMode, ThemeTokens> = {light: {...light, ...corrections.light}, dark: {...dark, ...corrections.dark}};
const aliases = declarations(source.match(/@theme inline\s*\{([^}]+)\}/)![1]);
// Tailwind self-aliases are compiler instructions, not valid CSS declarations.
export const themeAliases = Object.fromEntries(Object.entries(aliases).filter(([key, value]) => value !== `var(${key})`));
const serialize = (tokens: Record<string,string>) => Object.entries(tokens).map(([name,value])=>`${name}:${value};`).join('\n');
export const themeStylesheet = (['light','dark'] as const).map(mode => {
  const scope = `html[data-axolotl-library][data-theme="${mode}"],html[data-axolotl-library] [data-theme="${mode}"],html[data-axolotl-library] [data-header-theme="${mode}"]`;
  return `${scope}{${serialize({...themeTokens[mode], ...themeAliases})}color-scheme:${mode};}`;
}).join('\n');

// Header-only Light reference, shared across both modes. Other surfaces, status
// colors, the Brand showcase and global Dark tokens keep their existing values.
export const headerInteractionStylesheet = `html[data-axolotl-library] [data-header-theme]{
  --primary:${themeTokens.light['--primary']};
  --ring:${themeTokens.light['--ring']};
  --axo-hover:color-mix(in oklch,${themeTokens.light['--primary']} 20%,${themeTokens.light['--card']});
  --axo-hover-ink:${themeTokens.light['--foreground']};
}`;

// Header-owned status roles. Values preserve the accepted chart/destructive paints,
// but status consumers no longer depend on a catalog installing those generic roles.
export const headerStatusStylesheet = (['light','dark'] as const).map(mode =>
 `[data-header-theme="${mode}"]{${serialize({
  '--header-status-allowed': themeTokens[mode]['--chart-3'],
  '--header-status-blocked': themeTokens[mode]['--destructive'],
  '--header-status-unknown': 'var(--axo-muted)',
  '--header-status-checking': 'var(--axo-muted)',
 })}}`
).join('\n');
