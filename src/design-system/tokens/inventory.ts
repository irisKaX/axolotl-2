import { themeTokens } from './theme';
export const foundationGroups = ['Semantic Color Tokens','Dark / Light Themes','Typography','Font Families & Weights','Spacing','Radius','Borders','Shadows & Elevation','Surfaces & Materials','Motion & Transitions','Component States','Brand Colors','Chart Colors'] as const;
export type FoundationGroup = typeof foundationGroups[number];
export function tokenGroup(name:string):FoundationGroup {
 if(name.startsWith('--chart-'))return 'Chart Colors';
 if(name.startsWith('--font-'))return 'Font Families & Weights';
 if(name.startsWith('--shadow'))return 'Shadows & Elevation';
 if(name==='--spacing')return 'Spacing';
 if(name.startsWith('--radius'))return 'Radius';
 if(name==='--tracking-normal')return 'Typography';
 if(['--border','--input','--ring','--sidebar-border','--sidebar-ring'].includes(name))return 'Borders';
 return 'Semantic Color Tokens';
}
export const foundationTokens = Object.keys(themeTokens.light).map(name=>({name,group:tokenGroup(name),light:themeTokens.light[name as keyof typeof themeTokens.light],dark:themeTokens.dark[name as keyof typeof themeTokens.dark]}));
export const openDecisions = [
 'Export neobsahuje samostatné barvy success/warning. Stávající popisy a ikony zůstávají; pro text se používá foreground, pro chyby destructive. Chart colors nejsou stavové barvy.',
 'Georgia vyžaduje systémovou instalaci nebo samostatnou webfontovou licenci. Montserrat a Fira Code se načítají lokálně pod SIL OFL 1.1.',
 'Přesné barevné páry exportu zůstávají zachované. Například dark primary / primary-foreground vychází přibližně na 3,38:1, pod požadavkem WCAG AA pro běžný text.',
];
