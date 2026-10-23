import { useEffect } from 'react';
import { usePreferences } from '../app/PreferencesProvider';
/** Compatibility route only. library.html is the sole catalog bootstrap. */
export function canonicalLibraryUrl(search: string, theme: 'dark' | 'light') {
  const input=new URLSearchParams(search);
  const target=new URL('https://iriskax.github.io/axolotl-preview/ds-library-v1-1/');
  const section=input.get('section');
  target.searchParams.set('catalog','library');
  if (['legacy','headers'].includes(input.get('catalog')||'') || section==='layout') target.searchParams.set('section','dashboard');
  else if (section && /^[a-z-]+$/.test(section)) target.searchParams.set('section',section);
  else if (input.get('catalog')==='buttons') target.searchParams.set('section','buttons');
  target.searchParams.set('theme',theme);
  target.hash='design-system';
  return target.href;
}
export function DesignSystem() {
  const {resolvedTheme}=usePreferences();
  const href=canonicalLibraryUrl(location.search,resolvedTheme);
  useEffect(()=>{location.replace(href);},[href]);
  return <p><a href={href}>Otevřít Design System Library V1.1</a></p>;
}
