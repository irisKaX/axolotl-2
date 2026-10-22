import source from './tweakcn.export.css?raw';
export type ThemeMode = 'light' | 'dark';
export type ThemeTokens = Record<`--${string}`, string>;
function declarations(block: string): ThemeTokens {
  return Object.fromEntries(Array.from(block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g), m => [m[1], m[2].trim()]));
}
// The complete user export is the single source. Tailwind-only directives are
// not applied globally; existing React components consume these exact values.
const light = declarations(source.match(/:root\s*\{([^}]+)\}/)![1]);
const dark = {...light, ...declarations(source.match(/\.dark\s*\{([^}]+)\}/)![1])};
export const themeTokens: Record<ThemeMode, ThemeTokens> = {light, dark};
const aliases = declarations(source.match(/@theme inline\s*\{([^}]+)\}/)![1]);
// Tailwind self-aliases are compiler instructions, not valid CSS declarations.
export const themeAliases = Object.fromEntries(Object.entries(aliases).filter(([key, value]) => value !== `var(${key})`));
const serialize = (tokens: Record<string,string>) => Object.entries(tokens).map(([name,value])=>`${name}:${value};`).join('\n');
export const themeStylesheet = (['light','dark'] as const).map(mode => {
  const scope = `html[data-axolotl-library][data-theme="${mode}"],html[data-axolotl-library] [data-theme="${mode}"],html[data-axolotl-library] [data-header-theme="${mode}"]`;
  return `${scope}{${serialize({...themeTokens[mode], ...themeAliases})}color-scheme:${mode};}`;
}).join('\n');
