import library from './library.css?raw';
import unified from './unified.css?raw';
import header from '../../app/header/header.module.css?raw';
import button from '../Button/Button.css?raw';
import { dashboardTokens, dashboardThemes } from './dashboard';
import { paints } from './paints';
export type FoundationGroup = 'Colors & Gradients' | 'Semantic Colors' | 'Dark / Light Themes' | 'Typography' | 'Font Families & Weights' | 'Spacing' | 'Radius' | 'Borders' | 'Shadows & Elevation' | 'Surfaces & Materials' | 'Motion & Transitions' | 'Component States';
export const foundationGroups: FoundationGroup[] = ['Colors & Gradients','Semantic Colors','Dark / Light Themes','Typography','Font Families & Weights','Spacing','Radius','Borders','Shadows & Elevation','Surfaces & Materials','Motion & Transitions','Component States'];
export type FoundationToken = {name:string;value:string;scope:string;source:string;design:'draft'|'approved';production:boolean;group:FoundationGroup};
function group(name:string):FoundationGroup {
 if(/font|weight/.test(name))return 'Font Families & Weights';
 if(/label|leading|tracking/.test(name))return 'Typography';
 if(/duration|easing|lift|beam-width/.test(name))return 'Motion & Transitions';
 if(/space|padding|gap|inset$/.test(name))return 'Spacing';
 if(/radius/.test(name))return 'Radius';
 if(/shadow|rim/.test(name))return 'Shadows & Elevation';
 if(/line|edge|border|glint/.test(name))return 'Borders';
 if(/surface|widget|office$|backdrop|tile/.test(name))return 'Surfaces & Materials';
 if(/hover|focus|active|selected|danger|error|success|warning/.test(name))return 'Component States';
 return 'Semantic Colors';
}
// Inventory reads the real CSS definitions. It never supplies a second set of values.
function cssTokens(css:string,source:string,production=false):FoundationToken[] {
 const result:FoundationToken[]=[];
 for(const block of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const scope=block[1].replace(/\/\*[\s\S]*?\*\//g,'').trim();
  for(const value of block[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))result.push({name:value[1],value:value[2].trim(),scope,source,design:production?'approved':'draft',production,group:group(value[1])});
 }
 return result;
}
export const foundationTokens:FoundationToken[]=[
 ...paints.map(p=>({name:p.name,value:p.css,scope:'Paint registry; schválení podle jednotlivých barev',source:'src/design-system/tokens/paints.ts',design:p.design,production:p.production,group:'Colors & Gradients' as const})),
 ...cssTokens(library,'src/design-system/tokens/library.css'),
 ...cssTokens(unified,'src/design-system/tokens/unified.css'),
 ...cssTokens(header,'src/app/header/header.module.css',true),
 ...cssTokens(button,'src/design-system/Button/Button.css'),
 ...Object.entries(dashboardTokens).map(([name,value])=>({name,value,scope:'Pouze schválená kompozice 523c983',source:'src/design-system/tokens/dashboard.ts',design:'approved' as const,production:false,group:group(name)})),
 ...Object.entries(dashboardThemes).flatMap(([theme,tokens])=>Object.entries(tokens).map(([name,value])=>({name,value,scope:`Dashboard · ${theme}`,source:'src/design-system/tokens/dashboard.ts',design:'approved' as const,production:false,group:group(name)}))),
];
export const openDecisions = [
 'Jednotná typografická stupnice napříč všemi komponentami není schválená.',
 'Katalogové povrchy Halo Soft a produkční Header mají odlišné sémantické role. Jejich sjednocení nesmí potichu změnit vzhled.',
 'Globální škála elevation a mapování všech motion stavů zůstávají návrhem; převzaté hodnoty platí ve svém uvedeném rozsahu.',
];
