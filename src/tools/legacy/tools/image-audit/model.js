export const hasImageAlt = item => item.altApplicable ?? (!item.variant && ['img','input'].includes(item.sourceKind));
export const hasNativeLazy = item => item.lazyApplicable ?? (!item.variant && item.sourceKind === 'img');

export function analyzeImageAudit(snapshot) {
  const items = (snapshot.items || []).map((item, index) => {
    const issues = [];
    if (item.formatVerified && item.format && item.format !== 'webp') issues.push(`Formát ${item.format.toUpperCase()} není WebP`);
    if (item.formatMismatch) issues.push(`MIME deklaruje ${item.declaredFormat}, obsah má signaturu ${item.format}`);
    if (hasImageAlt(item) && item.alt === null) issues.push('Chybí atribut ALT');
    else if (hasImageAlt(item) && item.alt === '') issues.push('Prázdný ALT: ověřte dekorativní účel');
    if (hasNativeLazy(item) && !item.aboveFold && item.loading !== 'lazy') issues.push('Pod prvním viewportem bez nativního lazy loading; vlastní řešení neověřeno');
    const guessed = item.url?.match(/\.(webp|png|jpe?g|gif|avif|svg)(?:[?#]|$)/i)?.[1]?.toLowerCase();
    return {...item, id:index, bytes:item.bytes > 0 ? item.bytes : null, format:item.format || guessed || 'unknown', formatVerified:!!item.formatVerified, issues};
  });
  return {...snapshot, items, summary:{
    total:items.length,
    variants:items.filter(item => item.variant).length,
    declared:items.filter(item => item.usage === 'declared').length,
    missingAlt:items.filter(item => hasImageAlt(item) && item.alt === null).length,
    unknownSize:items.filter(item => item.bytes === null).length
  }};
}
