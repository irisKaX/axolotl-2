import { useReducer, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { BookOpen, Grip, Plus, LockKeyhole, Trash2, Settings2 } from 'lucide-react';
import { GridLayout, noCompactor, useContainerWidth, type LayoutItem } from 'react-grid-layout';
import { Button } from '../../../../design-system/Button';
import { Card, Dialog, SegmentedControl, Switch } from '../../../../design-system/library';
import { FindPhraseWidget, MiniQrWidget } from '../../../../design-system/widgets/Widgets';
import { useFindPhraseDemo, useMiniQr } from '../../../../design-system/widgets/state';
import { useDesignSystem } from '../../../../design-system/library/Provider';
import { compositions, dimensions, initialLayout, reduceLayout, layoutFor, viewFor, columns,
  type Composition, type Item, type Kind, type Size } from './model';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './layout.css';
const compactor = { ...noCompactor, preventCollision: true };
const sizes = [{ value: 'small', label: 'S · kompaktní' }, { value: 'medium', label: 'M · doporučená' }, { value: 'large', label: 'L · širší' }];
function WidgetContent({ item, real }: { item: Item; real: boolean }) {
  // Adapters live at a stable keyed position even while moving or hiding the UI.
  const search = useFindPhraseDemo(),
    qr = useMiniQr();
  const size = item.size === "large" ? "large" : "medium";
  if (real && item.kind === "search")
    return (
      <FindPhraseWidget
        {...search}
        size={size}
        detailAction={
          <Dialog
            title="Demo předání do nástroje"
            description="Žádný skutečný sken se nespustil."
            trigger={
              <Button size="small" variant="ghost">
                Otevřít v nástroji
              </Button>
            }
          >
            <p>
              Budoucí propojení s nástrojem Hledání na webu. Výsledek této
              ukázky zůstává pouze v Layout Studiu.
            </p>
          </Dialog>
        }
      />
    );
  if (real && item.kind === "qr") return <MiniQrWidget {...qr} size={size} />;
  if (item.kind === "generic" && item.size === "small")
    return (
      <Card title="Obecný widget" density="compact">
        <div className="dls-placeholder">
          <span className="ds-hint">S · kompaktní akce</span>
          <p>Strukturální placeholder</p>
        </div>
      </Card>
    );
  return (
    <Card title={dimensions[item.kind].title} density="compact">
      <div className="dls-placeholder">
        <span className="ds-catalog-eyebrow">
          Strukturální placeholder ·{" "}
          {item.kind === "generic"
            ? { small: "S", medium: "M", large: "L" }[item.size]
            : "pracovní widget"}
        </span>
        <p>
          {item.kind === "search"
            ? "Prostor pro frázi nebo asset a jednu rychlou akci."
            : item.kind === "qr"
              ? "Prostor pro URL, QR náhled a export."
              : "Volitelný pracovní obsah. Bez předstírání hotové funkce."}
        </p>
        <div className="dls-wire" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span className="ds-hint">
          {item.kind === "generic"
            ? "Kompaktní akce nebo přehled"
            : "Přepněte na skutečné UI pro ověření obsahu"}
        </span>
      </div>
    </Card>
  );
}
export function LayoutStudio() {
  const [state, dispatch] = useReducer(reduceLayout, undefined, initialLayout);
  const [editing, setEditing] = useState(false), [real, setReal] = useState(false);
  const [addOpen, setAddOpen] = useState(false), [selected, setSelected] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const { width, containerRef } = useContainerWidth({ initialWidth: 1200 });
  const env = useDesignSystem();
  const editButton = useRef<HTMLButtonElement>(null);
  const view = viewFor(width), cols = columns[view], grid = layoutFor(state, view);
  const selectedItem = state.items.find(item => item.id === selected);
  const selectedGeometry = grid.find(item => item.i === selected);
  function adjust(id: string, patch: Partial<Pick<LayoutItem, 'x' | 'y' | 'w' | 'h'>>) {
    const action = { type: 'adjust' as const, view, id, patch };
    const next = reduceLayout(state, action);
    dispatch(action);
    setAnnouncement(next === state ? 'Místo je obsazené. Zvolte volnou pozici nebo menší rozměr.' : 'Pozice a rozměry upraveny.');
  }
  function keyboard(e: KeyboardEvent, id: string, resize = false) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const item = grid.find(item => item.i === id)!;
    const dx = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    const dy = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
    adjust(id, resize ? { w: item.w + dx, h: item.h + dy } : { x: item.x + dx, y: item.y + dy });
  }
  function add(kind: Kind, size?: Size) {
    dispatch({ type: 'add', kind, size }); setAddOpen(false);
    setAnnouncement(`${dimensions[kind].title} přidán na první volné místo.`);
  }
  return <div className="dls" data-composition={state.composition} data-editing={editing} data-theme={env.theme}>
    <div className="dls-toolbar">
      <SegmentedControl label="Kompozice pracovní plochy" items={compositions.map(({value, label}) => ({value, label}))}
        value={state.composition} onValueChange={value => { dispatch({ type: 'composition', value: value as Composition }); setSelected(null); }} />
      <div className="ds-actions">
        <Switch label="Skutečné UI widgetů" checked={real} onChange={e => setReal(e.currentTarget.checked)} />
        <Dialog title="Notebook · trvalý přístup" description="Strukturální placeholder. Skutečný Notebook se zde neotevírá."
          trigger={<Button size="small" icon={<BookOpen />}>Notebook</Button>}>
          <p>Notebook zůstává dostupný v každé kompozici a nelze jej odstranit z pracovní plochy.</p>
        </Dialog>
        <Button ref={editButton} size="small" variant={editing ? 'primary' : 'secondary'} onClick={() => { setEditing(!editing); setSelected(null); }}>
          {editing ? 'Hotovo' : 'Upravit Dashboard'}
        </Button>
      </div>
    </div>
    {editing && <div className="dls-edit-bar">
      <div className="ds-actions">
        <Dialog title="Přidat widget" description="Widget se vloží na volné místo. Rozložení ostatních karet zůstane zachované."
          open={addOpen} onOpenChange={setAddOpen} trigger={<Button size="small" icon={<Plus />}>Přidat widget</Button>}>
          <div className="dls-add-list">
            <Button onClick={() => add('search')}>Find Phrase · demo</Button>
            <Button onClick={() => add('qr')}>Mini QR · lokální generování</Button>
            {sizes.map(size => <Button key={size.value} onClick={() => add('generic', size.value as Size)}>Obecný widget {size.label}</Button>)}
          </div>
        </Dialog>
        <Button size="small" variant="ghost" onClick={() => { dispatch({type:'reset'}); setSelected(null); setAnnouncement('Obnoveno výchozí rozložení.'); }}>Obnovit výchozí</Button>
      </div>
      <p id="dls-move-help">Uchopte tečkovaný úchyt a přesuňte kartu. Pravý dolní roh mění oba rozměry. Obsazená místa zůstávají chráněná.</p>
      <p id="dls-resize-help">Klávesnice: šipky na úchytu přesouvají, na rohu mění rozměry. Přesná poloha a velikost jsou dostupné také tlačítkem u úchytu.</p>
      {selectedItem && selectedGeometry && <form className="dls-inspector" key={`${selected}-${view}-${selectedGeometry.x}-${selectedGeometry.y}-${selectedGeometry.w}-${selectedGeometry.h}`}
        onSubmit={e => {
          e.preventDefault();
          const values = Object.fromEntries(['x','y','w','h'].map(key => [key, (e.currentTarget.elements.namedItem(key) as HTMLInputElement).valueAsNumber]));
          if (Object.values(values).every(Number.isInteger)) adjust(selectedItem.id, values);
        }} aria-label={`Poloha a velikost ${dimensions[selectedItem.kind].title}`}>
        <strong>{dimensions[selectedItem.kind].title}</strong>
        {(['x','y','w','h'] as const).map((key, index) => <label key={key}>{['Sloupec', 'Řádek', 'Šířka', 'Výška'][index]}
          <input key={`${selected}-${view}-${selectedGeometry[key]}`} type="number" name={key} required defaultValue={selectedGeometry[key]}
            min={key === 'x' || key === 'y' ? 0 : key === 'w' ? selectedGeometry.minW : selectedGeometry.minH}
            max={key === 'w' ? cols : key === 'x' ? cols - selectedGeometry.w : undefined}
 />
        </label>)}
        <Button type="submit" size="small" variant="primary">Použít</Button>
        <Button size="small" variant="secondary" onClick={() => adjust(selectedItem.id, { x: 0, w: cols })}>Celá šířka</Button>
        <Button size="small" variant="ghost" onClick={() => setSelected(null)}>Zavřít ovládání</Button>
      </form>}
    </div>}
    <h2 className="dls-sr-only">Pracovní plocha</h2>
    <div ref={containerRef} className="dls-board" data-columns={cols}
      style={{ '--dls-cell': `${(width + 8) / cols}px` } as CSSProperties}>
      <GridLayout width={width} layout={grid} compactor={compactor}
        gridConfig={{ cols, rowHeight: 12, margin: [8,8], containerPadding: [0,0] }}
        dragConfig={{ enabled: editing, handle: '.dls-drag', threshold: 4 }}
        resizeConfig={{ enabled: editing, handles: ['se'], handleComponent: (_axis, ref) =>
          <button ref={ref as React.Ref<HTMLButtonElement>} className="react-resizable-handle react-resizable-handle-se dls-resize"
            aria-label="Změnit rozměry widgetu" aria-describedby="dls-resize-help" tabIndex={editing ? 0 : -1}
            onKeyDown={e => { const id = e.currentTarget.closest<HTMLElement>('[data-layout-item]')?.dataset.layoutItem; if (id) keyboard(e, id, true); }} /> }}
        onDragStop={layout => { dispatch({type:'commit', view, layout}); setAnnouncement('Widget přesunut.'); }}
        onResizeStop={layout => { dispatch({type:'commit', view, layout}); setAnnouncement('Rozměry widgetu změněny.'); }}>
        <section key="office" className="dls-office" data-layout-item="office" aria-label="Pevná centrální zóna">
          <Card title="Axolotl Office" density="compact"><div className="dls-office-content">
            <span className="ds-catalog-eyebrow"><LockKeyhole size={14} aria-hidden="true" /> Pevný střed pracovní plochy</span>
            <div className="dls-office-scene" aria-hidden="true"><span/><span/><span/></div>
            <span className="ds-hint">Prostorový placeholder · bez postav a animací</span>
          </div></Card>
        </section>
        {state.items.map(item => <section key={item.id} className="dls-item" data-layout-item={item.id}
          data-size={item.size} aria-label={`${dimensions[item.kind].title} · volitelný widget`}>
          <div className="dls-widget-content"><WidgetContent item={item} real={real}/></div>
          {editing && <div className="dls-edit-actions">
            <Button size="small" variant="icon" className="dls-drag" icon={<Grip/>}
              aria-label={`Přesunout ${dimensions[item.kind].title}`} aria-describedby="dls-move-help" onKeyDown={e => keyboard(e, item.id)} />
            <Button size="small" variant="icon" icon={<Settings2/>} aria-label={`Poloha a velikost ${dimensions[item.kind].title}`}
              aria-pressed={selected === item.id} onClick={() => setSelected(selected === item.id ? null : item.id)} />
            <Button size="small" variant="icon" icon={<Trash2/>} aria-label={`Odebrat ${dimensions[item.kind].title}`}
              onClick={() => { dispatch({type:'remove', id:item.id}); setSelected(null); setAnnouncement('Widget odebrán.'); editButton.current?.focus(); }} />
          </div>}
        </section>)}
      </GridLayout>
    </div>
    <div className="dls-note"><span>{compositions.find(c => c.value === state.composition)?.description}</span>
      <span>Rozložení se neukládá. Header nahoře je skutečný AppHeader.</span></div>
    <p className="dls-announcement" role="status" aria-live="polite">{announcement}</p>
  </div>;
}
