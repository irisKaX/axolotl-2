/** Experimental tokens only. Production styles never import this registry. */
export const studies = [
  { id: 'A', name: 'Precision PillNav', short: 'Přesnost a klid', material: 'Satén / jednotná rovina', description: 'Jeden rytmus. Plné navigační pill, jemnější pravé ovládání a URL na společné ose.', benefit: 'Nejčistší hierarchie a nejmenší vizuální zátěž při každodenní práci.', tradeoff: 'Nejméně prostorový výraz. Efekt stojí na proporcích a detailu, ne na světle.', risk: 'Opticky menší ikony musí udržet čitelnost; jejich klikací plocha zůstává 44 × 44 px.', nav: 44, url: 44, action: 32, icon: 17, track: 54, trackHeight: 30, gap: 8, radius: 24, motion: 160 },
  { id: 'B', name: 'Refined Spatial PillNav', short: 'Hloubka pod kontrolou', material: 'Vrstvené sklo / zapuštěné URL', description: 'Navigace a ovládání lehce vystupují z nosné plochy. URL tvoří klidnější, zapuštěný kanál.', benefit: 'Nejvýraznější prostorová hierarchie. Povrchy zřetelně odlišují akci od kontextu.', tradeoff: 'Vyšší header a větší vizuální váha. Potřebuje více prostoru než Precision.', risk: 'Rozostření může být dražší na slabším zařízení; neprůhledný základ drží kontrast i bez něj.', nav: 48, url: 48, action: 38, icon: 18, track: 60, trackHeight: 36, gap: 12, radius: 28, motion: 220 },
  { id: 'C', name: 'Experimental PillNav', short: 'Charakter v detailu', material: 'Samostatné pill moduly / světelná hrana', description: 'Navigace, URL a ovládání mají vlastní pill povrch místo jedné společné plochy. Tenká světelná hrana a osobité detaily drží celek pohromadě.', benefit: 'Nejosobitější směr. Výrazný aktivní stav a kultivovaná odezva bez nepřetržité animace.', tradeoff: 'Více vizuálních akcentů; při dlouhé práci může působit rušivěji než A.', risk: 'Obrys a mikrointerakce potřebují pečlivé ladění obou témat; reduced motion pohyb vypíná.', nav: 44, url: 44, action: 34, icon: 17, track: 64, trackHeight: 32, gap: 8, radius: 24, motion: 180 },
] as const;
export type VisualVariant = typeof studies[number]['id'];
export const parseVisual = (value: string | null): VisualVariant => value === 'B' || value === 'C' ? value : 'A';
export const colors = {
  dark: { ink: '#f4f1fa', muted: '#c1bacd', base: '#24212d', raised: '#3a3547', lower: '#292532', edge: '#62596f', hover: 'rgba(255, 255, 255, 0.06)', accent: '#7c3aed', focus: '#d1b5ff' },
  light: { ink: '#241b32', muted: '#61566e', base: '#eeeaf4', raised: '#ffffff', lower: '#f4f0f8', edge: '#a79bb6', hover: 'rgba(24, 24, 27, 0.05)', accent: '#7c3aed', focus: '#6221c2' },
};
export function tokenStyles(variant: VisualVariant, theme: 'dark' | 'light') {
  const v = studies.find(s => s.id === variant)!;
  return {
    ...Object.fromEntries(Object.entries(colors[theme]).map(([key,value]) => [`--vu-${key}`,value])),
    '--vu-nav-h': `${v.nav}px`, '--vu-url-h': `${v.url}px`, '--vu-action': `${v.action}px`, '--vu-icon': `${v.icon}px`,
    '--vu-track-w': `${v.track}px`, '--vu-track-h': `${v.trackHeight}px`, '--vu-gap': `${v.gap}px`, '--vu-panel-radius': `${v.radius}px`, '--vu-duration': `${v.motion}ms`,
  };
}
