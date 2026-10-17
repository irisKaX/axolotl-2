import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PreferencesProvider } from '../../app/PreferencesProvider';
import { PageContextProvider } from '../../app/PageContextProvider';
import { createPreferencesStore } from '../../lib/preferences';
import { Lab } from './Lab';
import { Scene } from './Scene';
import { parseVariant } from './variants';
import '../../styles/app.css';
import './responsive-lab.css';

const params = new URLSearchParams(location.search);
const scene = params.get('view') === 'scene';
const variant = parseVariant(params.get('variant'));
const theme = params.get('theme') === 'light' ? 'light' : 'dark';
// Separate from production and the older header studies; each variant has its own settings.
const preferences = createPreferencesStore({ storagePrefix: `axolotl-responsive-lab-${scene ? variant : 'shell'}`, initialTheme: theme });
preferences.set('theme', theme);
document.body.classList.add(scene ? 'hr-scene-page' : 'hr-lab-page');
createRoot(document.getElementById('axolotl-root')!).render(<StrictMode><PreferencesProvider store={preferences}><PageContextProvider>{scene ? <Scene variant={variant}/> : <Lab/>}</PageContextProvider></PreferencesProvider></StrictMode>);
