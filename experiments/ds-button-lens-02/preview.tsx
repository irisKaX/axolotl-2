import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../../src/design-system/Button';
import ButtonShowcase from '../../src/pages/design-system/ButtonShowcase';
import './preview.css';

function Preview() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const toggle = () => { const next = theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; setTheme(next); };
  return <main>
    <header className="button-preview-toolbar"><div><h1>Axolotl 2.0 · Button</h1><p>Izolovaný náhled implementované React komponenty</p></div><Button id="preview-theme" onClick={toggle}>{theme === 'dark' ? 'Light' : 'Dark'}</Button></header>
    <p className="button-preview-source">Tento náhled používá <code>src/design-system/Button</code> z větve <code>experiment/ds-button-lens-02</code>. Nejde o původní experiment.</p>
    <ButtonShowcase preferenceHint="Dark/light přepneš tlačítkem nahoře. Omezení pohybu respektuje i nastavení systému. Tento izolovaný náhled nemění preference hlavní aplikace." />
    <footer className="button-preview-footer"><a href="./provenance.json">Zdroj a kontrolní součty</a><a href="./react-bits-license.txt">Licence React Bits</a><a href="https://github.com/irisKaX/axolotl-2/tree/experiment/ds-button-lens-02/src/design-system/Button">Zdroj komponenty ↗</a></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>);
