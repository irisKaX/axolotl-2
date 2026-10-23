import { useLayoutEffect, type ReactNode } from 'react';
import { themeStylesheet, headerInteractionStylesheet } from '../tokens/theme';
import './fonts.css';
import './components.css';
import './header.css';
/** Installed only by library.html; production App never imports this theme. */
export function LibraryTheme({children}: {children: ReactNode}) {
  useLayoutEffect(() => {
    document.documentElement.dataset.axolotlLibrary = 'tweakcn-v1';
    return () => { delete document.documentElement.dataset.axolotlLibrary; };
  }, []);
  return <><style data-library-theme>{themeStylesheet + headerInteractionStylesheet}</style>{children}</>;
}
