/** Preserve the reason for a browser failure across async and message boundaries. */
export function pageError(code, message, cause, extra = {}) {
  return Object.assign(new Error(message, cause ? { cause } : undefined), { code, ...extra });
}
function isMissingTab(error) {
  return (
    error?.code === 'TAB_CLOSED' ||
    /No tab(?: with id)?(?:\s*:?\s*\d+)?\.?$/i.test(error?.message || '') ||
    /No tab with id:/i.test(error?.message || '')
  );
}
export function connectionError(error) {
  if (error?.code) return error;
  if (isMissingTab(error))
    return pageError(
      'TAB_CLOSED',
      'Karta už není dostupná. Mohla být zavřena nebo nahrazena prohlížečem. U původní stránky použijte „Změnit kartu“.',
      error
    );
  if (
    /Cannot access (?:contents of|a?\s*(?:chrome|edge|about|https?|file):)|Missing host permission|must request permission|not allowed to access|extensions gallery cannot be scripted/i.test(
      error?.message || ''
    )
  ) {
    return pageError(
      'ACCESS_DENIED',
      'Prohlížeč nepovolil přístup k obsahu této stránky. Zkontrolujte přístup O2 Axolotl k danému webu a stránku obnovte.',
      error,
      {detail:String(error?.message||'').slice(0,1200)}
    );
  }
  return pageError(
    'PAGE_UNAVAILABLE',
    'Spojení se stránkou se přerušilo. Nechte ji dokončit načítání a spusťte operaci znovu.',
    error,
    {detail:String(error?.message||'').slice(0,1200)}
  );
}
