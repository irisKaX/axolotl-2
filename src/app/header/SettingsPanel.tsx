import { useId, useLayoutEffect, useRef, useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { Icon, type IconName } from '../../components/Icon';
import { usePreferences } from '../PreferencesProvider';
import { usePageContext } from '../PageContextProvider';
import { PanelFooter, PanelHeading, PanelRow } from './PanelUI';
import { useHeaderPopovers } from './Popover';
import s from './header.module.css';

type View = 'home' | 'appearance' | 'integrations' | 'about';
const entries: { label: string; icon: IconName; view?: View }[] = [
  { label:'Profil', icon:'profile' }, { label:'Vzhled a prostředí', icon:'appearance', view:'appearance' },
  { label:'Integrace', icon:'integrations', view:'integrations' }, { label:'Oprávnění k webům', icon:'shield' },
  { label:'Upozornění', icon:'bell' }, { label:'Data a soukromí', icon:'lock' }, { label:'O aplikaci', icon:'info', view:'about' },
];

function Choice({ label, value, onChange, options, note }: { label: string; value: string; onChange: (value: string) => void; options: {value:string;label:string}[]; note?: string }) {
  const id = useId();
  const prefs = usePreferences();
  const { header } = useHeaderPopovers();
  const [open, setOpen] = useState(false);
  return <div className={s.field}>
    <label id={`${id}-label`} htmlFor={id}>{label}</label>
    <Select.Root value={value} onValueChange={onChange} open={open} onOpenChange={setOpen}>
      <Select.Trigger id={id} className={s.selectTrigger} data-header-select-trigger aria-labelledby={`${id}-label`} aria-describedby={note ? `${id}-note` : undefined}>
        <Select.Value/><Select.Icon asChild><Icon name="chevron"/></Select.Icon>
      </Select.Trigger>
      <Select.Portal><Select.Content position="popper" align="start" sideOffset={6}
        collisionPadding={{top:(header.current?.getBoundingClientRect().bottom ?? 0)+12,bottom:12,left:12,right:12}}
        data-header-select data-header-theme={prefs.resolvedTheme} data-text-size={prefs.textSize} data-motion={prefs.reducedMotion ? 'reduced' : 'full'}
        className={`${s.scope} ${s.selectContent}`} aria-labelledby={`${id}-label`}>
        <Select.ScrollUpButton className={s.selectScroll}><Icon name="chevron"/></Select.ScrollUpButton>
        <Select.Viewport className={s.selectViewport}>{options.map(option => <Select.Item key={option.value} value={option.value} className={s.selectOption}>
          <Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator className={s.check} aria-hidden="true">✓</Select.ItemIndicator>
        </Select.Item>)}</Select.Viewport>
        <Select.ScrollDownButton className={s.selectScroll}><Icon name="chevron"/></Select.ScrollDownButton>
      </Select.Content></Select.Portal>
    </Select.Root>
    {note && <p id={`${id}-note`} className={s.note}>{note}</p>}
  </div>;
}
function Appearance() {
  const prefs = usePreferences();
  const [saved, setSaved] = useState('Změny se ukládají automaticky do tohoto prohlížeče.');
  const cursorId = useId();
  function set(key: string, value: unknown) { setSaved(prefs.setPreference(key, value).saved ? 'Změny jsou uložené v tomto prohlížeči.' : 'Nastavení platí nyní. Prohlížeč nepovolil jeho uložení.'); }
  return <>
    <Choice label="Barevný režim" value={prefs.theme} onChange={value => set('theme', value)} options={[{value:'dark',label:'Tmavý'},{value:'light',label:'Světlý'},{value:'system',label:'Podle systému'}]}/>
    <Choice label="Velikost textu" value={prefs.textSize} onChange={value => set('textSize', value)} note="Text v rozbalených nabídkách a obsahu aplikace." options={[{value:'standard',label:'Výchozí'},{value:'large',label:'Větší (115 %)'}]}/>
    <Choice label="Animace" value={prefs.motion} onChange={value => set('motion', value)} note="Omezení vypne pohybové přechody a pozastaví efekt kurzoru." options={[{value:'system',label:'Podle systému'},{value:'full',label:'Zapnuté'},{value:'reduced',label:'Omezené'}]}/>
    <label className={s.checkField} htmlFor={cursorId}><span>Efekt kurzoru<small>{prefs.reducedMotion ? 'Pozastaveno' : prefs.cursor ? 'Zapnuto' : 'Vypnuto'}</small></span><input id={cursorId} type="checkbox" role="switch" checked={prefs.cursor} disabled={prefs.reducedMotion} onChange={event => set('cursor', event.target.checked)}/></label>
    <p className={s.note}>{prefs.reducedMotion ? 'Efekt kurzoru je pozastavený při omezených animacích.' : prefs.resolvedTheme === 'dark' ? 'Glow Cursor zanechává modrofialovou světelnou stopu.' : 'Glow Cursor vytváří barevnou stopu pro světlé pozadí.'}</p>
    <p className={s.note} role="status">{saved}</p>
  </>;
}
function Integrations() {
  const { connection, store } = usePageContext();
  return <>
    <h3 className={s.subheading}>Propojení s prohlížečem</h3>
    <p className={s.note}>Tento samostatný náhled zatím není v seznamu adres podporovaných rozšířením. Použij ruční URL; stažené rozšíření funguje v hlavní aplikaci Axolotl.</p>
    <p className={s.note} role="status">{connection.status === 'checking' ? 'Ověřuji propojení…' : connection.status === 'connected' ? `Prohlížeč je propojený. Dostupných webových karet: ${connection.tabCount}.` : 'Prohlížeč není propojený. QR a konvertor fungují i bez něj.'}</p>
    <PanelRow icon="integrations" disabled={connection.status === 'checking'} onClick={() => store.refresh()}>Ověřit propojení</PanelRow>
    <a className={s.row} href={`${import.meta.env.BASE_URL}downloads/axolotl-prohlizec.zip`} download><Icon name="arrow"/><span>Stáhnout rozšíření</span></a>
    <details className={s.details}><summary>Jak propojit prohlížeč</summary><ol><li>Stáhni ZIP a rozbal ho do složky, kterou si ponecháš.</li><li>V Chrome otevři <code>chrome://extensions</code>, v Edge <code>edge://extensions</code>.</li><li>Zapni Režim pro vývojáře, zvol Načíst rozbalené a vyber složku s rozšířením.</li><li>Obnov Axolotl. Karty vybereš ikonou vedle URL.</li></ol><p>Rozšíření předává názvy a URL webových karet ze stejného okna. Po spuštění nástroje přečte vybranou stránku, pořídí snímek nebo stáhne vybrané soubory. Anonymní a interní karty se nezobrazují.</p><p>Pro odpojení vypni nebo odeber rozšíření.</p></details>
  </>;
}
export function SettingsPanel({ close, onNavigate }: { close: (restore?: boolean) => void; onNavigate: () => void }) {
  const [view, setView] = useState<View>('home');
  const previous = useRef<View | null>(null);
  const rows = useRef<Record<string, HTMLButtonElement | null>>({});
  useLayoutEffect(() => { if (view === 'home' && previous.current) rows.current[previous.current]?.focus({ preventScroll: true }); }, [view]);
  return <>
    <PanelHeading title={view === 'home' ? 'Nastavení' : entries.find(entry => entry.view === view)!.label} close={() => close(true)} back={view === 'home' ? undefined : () => { previous.current = view; setView('home'); }}/>
    {view === 'home' ? <ul className={s.list}>{entries.map(entry => <li key={entry.label}><PanelRow rowRef={element => { if (entry.view) rows.current[entry.view] = element; }} icon={entry.icon} disabled={!entry.view} onClick={() => { if (entry.view) setView(entry.view); }} trailing={entry.view ? <Icon name="chevron" className={s.forward}/> : undefined}>{entry.label}</PanelRow></li>)}</ul>
      : view === 'appearance' ? <Appearance/>
      : view === 'integrations' ? <Integrations/>
      : <>
        <h3 className={s.subheading}>Axolotl 2.0</h3><p className={s.note}>Verze 2.0 · Ve vývoji</p><p className={s.note}>Pracovní prostor s deseti nástroji pro média a kontrolu webu. Osobní workspace zatím připravujeme.</p>
        <PanelRow icon="appearance" href="#design-system" onClick={() => { close(); onNavigate(); }}>Otevřít vzorník komponent</PanelRow>
        <details className={s.details}><summary>Jak používat současnou verzi</summary><p>Horní nabídky otevřeš najetím myši nebo kliknutím. Do URL řádku vlož adresu a potvrď Enterem. S rozšířením můžeš vybírat otevřené karty.</p></details>
        <details className={s.details}><summary>Ovládání klávesnicí</summary><p>Tab přechází mezi prvky. Enter nebo mezerník otevře nabídku. V navigaci fungují šipky, Home a End. Escape zavře nabídku a vrátí fokus.</p></details>
        <details className={s.details}><summary>Kde jsou uložená data</summary><p>Nastavení se ukládá lokálně v prohlížeči. Ručně zadaná URL platí pro aktuální relaci. Přihlášení ani cloudová synchronizace zatím nejsou k dispozici.</p></details>
        <PanelRow href="https://github.com/irisKaX/axolotl-2" icon="info" external>GitHub ↗</PanelRow>
        <PanelRow href="https://github.com/irisKaX/axolotl-2/commits/main/" icon="info" external>Historie změn ↗</PanelRow>
      </>}
    <PanelFooter>Nastavení Axolotlu</PanelFooter>
  </>;
}
