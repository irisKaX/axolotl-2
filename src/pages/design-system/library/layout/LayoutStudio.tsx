import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  BookOpen,
  Grip,
  MoveDownRight,
  Plus,
  LockKeyhole,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import { Button } from "../../../../design-system/Button";
import {
  Card,
  Dialog,
  Select,
  SegmentedControl,
  Switch,
} from "../../../../design-system/library";
import {
  FindPhraseWidget,
  MiniQrWidget,
} from "../../../../design-system/widgets/Widgets";
import {
  useFindPhraseDemo,
  useMiniQr,
} from "../../../../design-system/widgets/state";
import {
  compositions,
  dimensions,
  initialLayout,
  itemWidth,
  itemSpan,
  packBottom,
  reduceLayout,
  zoneOptions,
  type Action,
  type Composition,
  type Item,
  type Kind,
  type Size,
  type Zone,
} from "./model";
import { useDesignSystem } from "../../../../design-system/library/Provider";
import "./layout.css";
type Gesture = {
  mode: "move" | "resize";
  item: Item;
  x: number;
  y: number;
  moved: boolean;
  zone?: Zone;
  before?: string;
  height: number;
  size: Size;
  span: number;
  startWidth: number;
  widths: number[];
};
type HandleEvents = {
  onPointerDown: (
    e: PointerEvent<HTMLButtonElement>,
    item: Item,
    mode: Gesture["mode"],
  ) => void;
  onPointerMove: (e: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onLostPointerCapture: () => void;
};
const sizes = [
  { value: "small", label: "S · kompaktní" },
  { value: "medium", label: "M · doporučená" },
  { value: "large", label: "L · širší" },
];
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
function EditableWidget({
  item,
  real,
  editing,
  style,
  dispatch,
  handles,
  active,
  onRemove,
}: {
  item: Item;
  real: boolean;
  editing: boolean;
  style: CSSProperties;
  dispatch: (a: Action) => void;
  handles: HandleEvents;
  active: boolean;
  onRemove: () => void;
}) {
  const title = dimensions[item.kind].title;
  const options = item.kind === "generic" ? sizes : sizes.slice(1);
  return (
    <section
      className="dls-item"
      aria-label={`${title} · volitelný widget`}
      data-layout-item={item.id}
      data-layout-zone={item.zone}
      data-size={item.size}
      data-dragging={active || undefined}
      style={style}
    >
      {editing && (
        <div className="dls-editor">
          <div className="dls-edit-actions">
            <Button
              variant="icon"
              size="small"
              className="dls-drag"
              aria-label={`Přesunout ${title}`}
              aria-describedby="dls-move-help"
              icon={<Grip />}
              {...handles}
              onPointerDown={(e) => handles.onPointerDown(e, item, "move")}
              onKeyDown={(e) => {
                const zone =
                  e.key === "ArrowLeft"
                    ? "left"
                    : e.key === "ArrowRight"
                      ? "right"
                      : e.key === "End"
                        ? "bottom"
                        : null;
                if (zone) {
                  e.preventDefault();
                  dispatch({ type: "move", id: item.id, zone });
                } else if (["ArrowUp", "ArrowDown"].includes(e.key)) {
                  e.preventDefault();
                  dispatch({
                    type: "step",
                    id: item.id,
                    direction: e.key === "ArrowUp" ? -1 : 1,
                  });
                }
              }}
            />
            <Button
              variant="icon"
              size="small"
              aria-label={`${title} dříve v zóně`}
              icon={<ArrowUp />}
              onClick={() =>
                dispatch({ type: "step", id: item.id, direction: -1 })
              }
            />
            <Button
              variant="icon"
              size="small"
              aria-label={`${title} později v zóně`}
              icon={<ArrowDown />}
              onClick={() =>
                dispatch({ type: "step", id: item.id, direction: 1 })
              }
            />
            <Button
              variant="icon"
              size="small"
              aria-label={`Odebrat ${title}`}
              icon={<Trash2 />}
              onClick={onRemove}
            />
          </div>
          <Select
            size="small"
            aria-label={`Umístění ${title}`}
            value={item.zone}
            options={[...zoneOptions]}
            onValueChange={(zone) =>
              dispatch({ type: "move", id: item.id, zone: zone as Zone })
            }
          />
          <Select
            size="small"
            aria-label={`Šířka ${title}`}
            value={item.zone === "bottom" ? String(itemSpan(item)) : item.size}
            options={item.zone === "bottom" ? [
              { value: "1", label: "1 sloupec" },
              { value: "2", label: "2 sloupce" },
              { value: "3", label: "Celá šířka" },
            ] : options}
            onValueChange={(size) =>
              dispatch({
                type: "resize",
                id: item.id,
                size: item.zone === "bottom" ? item.size : size as Size,
                span: item.zone === "bottom" ? Number(size) : undefined,
                height: item.height,
              })
            }
          />
        </div>
      )}
      <WidgetContent item={item} real={real} />
      {editing && (
        <div className="dls-resize-row">
          <span className="ds-hint">
            Min. výška {Math.round(item.height)} px · obsah může růst
          </span>
          <Button
            variant="icon"
            size="small"
            className="dls-resize"
            aria-label={`Změnit rozměry ${title}`}
            aria-describedby="dls-resize-help"
            icon={<MoveDownRight />}
            {...handles}
            onPointerDown={(e) => handles.onPointerDown(e, item, "resize")}
            onKeyDown={(e) => {
              if (
                !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
                  e.key,
                )
              )
                return;
              e.preventDefault();
              const size =
                e.key === "ArrowLeft"
                  ? options[
                      Math.max(
                        0,
                        options.findIndex((x) => x.value === item.size) - 1,
                      )
                    ].value
                  : e.key === "ArrowRight"
                    ? options[
                        Math.min(
                          options.length - 1,
                          options.findIndex((x) => x.value === item.size) + 1,
                        )
                      ].value
                    : item.size;
              dispatch({
                type: "resize",
                id: item.id,
                size: item.zone === "bottom" ? item.size : size as Size,
                span: item.zone === "bottom"
                  ? itemSpan(item) + (e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0)
                  : undefined,
                height:
                  item.height +
                  (e.key === "ArrowUp" ? -20 : e.key === "ArrowDown" ? 20 : 0),
              });
            }}
          />
        </div>
      )}
    </section>
  );
}
export function LayoutStudio() {
  const [layout, dispatch] = useReducer(reduceLayout, undefined, initialLayout);
  const [editing, setEditing] = useState(false),
    [real, setReal] = useState(false),
    [announcement, setAnnouncement] = useState(""),
    [addOpen, setAddOpen] = useState(false);
  const [gesture, setGesture] = useState<Gesture | null>(null),
    gestureRef = useRef<Gesture | null>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const env = useDesignSystem();
  const changeGesture = (g: Gesture | null) => {
    gestureRef.current = g;
    setGesture(g);
  };
  const act = (a: Action) => {
    dispatch(a);
    if (a.type === "move")
      setAnnouncement(
        `Widget přesunut: ${zoneOptions.find((z) => z.value === a.zone)?.label}.`,
      );
    else if (a.type === "step")
      setAnnouncement("Pořadí widgetu v zóně upraveno.");
    else if (a.type === "resize")
      setAnnouncement("Rozměry widgetu upraveny v povolených mezích.");
  };
  useEffect(() => {
    const cancel = (e: KeyboardEvent) => {
      if (e.key === "Escape" && gestureRef.current) {
        e.preventDefault();
        changeGesture(null);
        setAnnouncement("Změna zrušena.");
      }
    };
    window.addEventListener("keydown", cancel);
    return () => window.removeEventListener("keydown", cancel);
  }, []);
  const handles: HandleEvents = {
    onPointerDown(e, item, mode) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.focus();
      e.currentTarget.setPointerCapture(e.pointerId);
      const element = e.currentTarget.closest<HTMLElement>(".dls-item")!;
      const board = element.parentElement!;
      const columns = getComputedStyle(board).gridTemplateColumns.split(" ").map(parseFloat);
      const gap = parseFloat(getComputedStyle(board).columnGap);
      const rect = element.getBoundingClientRect();
      let start = 0, offset = 0;
      while (start < columns.length - 1 && offset + columns[start] < rect.left - board.getBoundingClientRect().left) {
        offset += columns[start] + gap;
        start++;
      }
      const widths = columns.map((_, i) => {
        const count = i + 1, from = start + count > columns.length ? 0 : start;
        return columns.slice(from, from + count).reduce((a, b) => a + b, 0) + gap * i;
      });
      changeGesture({
        mode,
        item,
        x: e.clientX,
        y: e.clientY,
        moved: false,
        height: item.height,
        size: item.size,
        span: itemSpan(item),
        startWidth: rect.width,
        widths,
      });
    },
    onPointerMove(e) {
      const g = gestureRef.current;
      if (!g) return;
      const dx = e.clientX - g.x,
        dy = e.clientY - g.y;
      const moved = g.moved || Math.hypot(dx, dy) > 8;
      if (g.mode === "resize") {
        const options = g.item.kind === "generic" ? sizes : sizes.slice(1),
          base = options.findIndex((x) => x.value === g.item.size);
        const size = options[
          Math.max(0, Math.min(options.length - 1, base + Math.trunc(dx / 60)))
        ].value as Size;
        const d = dimensions[g.item.kind],
          height = Math.max(
            d.minHeight,
            Math.min(d.maxHeight, Math.round((g.item.height + dy) / 20) * 20),
          );
        const desired = g.startWidth + dx;
        const span = g.widths.reduce((best, width, i) =>
          Math.abs(width - desired) < Math.abs(g.widths[best] - desired) ? i : best, 0) + 1;
        changeGesture({
          ...g, moved, height,
          size: g.item.zone === "bottom" ? g.item.size : size,
          span: g.item.zone === "bottom" && Math.abs(dx) > 8 ? span : g.span,
        });
      } else {
        const target = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest<HTMLElement>("[data-layout-zone]");
        const zone = target?.dataset.layoutZone as Zone | undefined;
        changeGesture({
          ...g,
          moved,
          zone,
          before: target?.dataset.layoutItem,
        });
      }
    },
    onPointerUp() {
      const g = gestureRef.current;
      if (g?.moved) {
        if (g.mode === "resize")
          act({
            type: "resize",
            id: g.item.id,
            size: g.size,
            height: g.height,
            span: g.span,
          });
        else if (g.zone)
          act({ type: "move", id: g.item.id, zone: g.zone, before: g.before });
      }
      changeGesture(null);
    },
    onPointerCancel() {
      changeGesture(null);
    },
    onLostPointerCapture() {
      changeGesture(null);
    },
  };
  const items = layout.items.map((i) =>
    gesture?.mode === "resize" && gesture.item.id === i.id
      ? { ...i, height: gesture.height, size: gesture.size, span: gesture.span }
      : i,
  );
  const left = items.filter((i) => i.zone === "left"),
    right = items.filter((i) => i.zone === "right"),
    bottom = items.filter((i) => i.zone === "bottom");
  const rows = Math.max(1, left.length, right.length);
  const bottomPositions = packBottom(bottom);
  const leftWidth = Math.max(280, ...left.map(itemWidth)),
    rightWidth = Math.max(280, ...right.map(itemWidth));
  const add = (kind: Kind, size?: Size) => {
    dispatch({ type: "add", kind, size });
    setAddOpen(false);
    setAnnouncement(`${dimensions[kind].title} přidán do dolní zóny.`);
  };
  return (
    <div
      className="dls"
      data-composition={layout.composition}
      data-editing={editing}
      data-theme={env.theme}
    >
      <div className="dls-toolbar">
        <SegmentedControl
          label="Kompozice pracovní plochy"
          items={compositions.map(({ value, label }) => ({ value, label }))}
          value={layout.composition}
          onValueChange={(value) => {
            changeGesture(null);
            dispatch({ type: "composition", value: value as Composition });
          }}
        />
        <div className="ds-actions">
          <Switch
            label="Skutečné UI widgetů"
            checked={real}
            onChange={(e) => setReal(e.currentTarget.checked)}
          />
          <Dialog
            title="Notebook · trvalý přístup"
            description="Strukturální placeholder. Skutečný Notebook se zde neotevírá."
            trigger={
              <Button size="small" icon={<BookOpen />}>
                Notebook
              </Button>
            }
          >
            <p>
              Notebook zůstává dostupný v každé kompozici a nelze jej odstranit
              z pracovní plochy.
            </p>
          </Dialog>
          <Button
            ref={editButton}
            size="small"
            variant={editing ? "primary" : "secondary"}
            onClick={() => {
              changeGesture(null);
              setEditing(!editing);
            }}
          >
            {editing ? "Hotovo" : "Upravit Dashboard"}
          </Button>
        </div>
      </div>
      {editing && (
        <div className="dls-edit-bar">
          <div className="ds-actions">
            <Dialog
              title="Přidat widget"
              description="Widget se přidá do dolní zóny. Poté jej můžete přesunout."
              open={addOpen}
              onOpenChange={setAddOpen}
              trigger={
                <Button size="small" icon={<Plus />}>
                  Přidat widget
                </Button>
              }
            >
              <div className="dls-add-list">
                <Button onClick={() => add("search")}>
                  Find Phrase · demo
                </Button>
                <Button onClick={() => add("qr")}>
                  Mini QR · lokální generování
                </Button>
                {sizes.map((s) => (
                  <Button
                    key={s.value}
                    onClick={() => add("generic", s.value as Size)}
                  >
                    Obecný widget {s.label}
                  </Button>
                ))}
              </div>
            </Dialog>
            <Button
              size="small"
              variant="ghost"
              onClick={() => {
                changeGesture(null);
                dispatch({ type: "reset" });
                setAnnouncement("Obnoveno výchozí rozložení.");
              }}
            >
              Obnovit výchozí
            </Button>
          </div>
          <div className="dls-drop-tray" aria-label="Cílové zóny přesunu">
            {zoneOptions.map((z) => (
              <span
                key={z.value}
                data-layout-zone={z.value}
                data-drop-target={
                  (gesture?.mode === "move" && gesture.zone === z.value) ||
                  undefined
                }
              >
                {z.label}
              </span>
            ))}
          </div>
          <p id="dls-move-help">
            Přetáhněte úchyt do zóny nebo na widget. Alternativa: Umístění a
            šipky pořadí. Na úchytu ←/→ mění zónu, ↑/↓ pořadí, End přesune dolů.
            Escape zruší gesto.
          </p>
          <p id="dls-resize-help">
            Rozměry: táhněte pravý dolní úchyt; šipky na něm mění šířku/výšku.
            Obsah nikdy neořezáváme.
          </p>
        </div>
      )}
      <h2 className="dls-sr-only">Pracovní plocha</h2>
      <div
        className="dls-board"
        style={
          {
            "--dls-left": `${leftWidth}px`,
            "--dls-right": `${rightWidth}px`,
          } as CSSProperties
        }
      >
        <section
          className="dls-office"
          aria-label="Pevná centrální zóna"
          style={{ gridRow: `1 / span ${rows}` }}
        >
          <Card title="Axolotl Office" density="compact">
            <div className="dls-office-content">
              <span className="ds-catalog-eyebrow">
                <LockKeyhole size={14} aria-hidden="true" /> Pevný střed
                pracovní plochy
              </span>
              <div className="dls-office-scene" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>Místo pro budoucí širokou scénu.</p>
              <span className="ds-hint">
                Pouze prostorový placeholder · bez postav a animací
              </span>
            </div>
          </Card>
        </section>
        {items.map((item) => {
          const peers =
              item.zone === "left"
                ? left
                : item.zone === "right"
                  ? right
                  : bottom,
            index = peers.indexOf(item);
          const row =
            item.zone === "bottom"
              ? rows + 1 + bottomPositions[index].row
              : index + 1;
          const col =
            item.zone === "bottom"
              ? `${bottomPositions[index].column} / span ${bottomPositions[index].span}`
              : item.zone === "left"
                ? 1
                : 3;
          return (
            <EditableWidget
              key={item.id}
              item={item}
              real={real}
              editing={editing}
              style={
                {
                  gridColumn: col,
                  gridRow: row,
                  "--dls-height": `${item.height}px`,
                  "--dls-width": `${itemWidth(item)}px`,
                  "--dls-span": itemSpan(item),
                } as CSSProperties
              }
              dispatch={act}
              handles={handles}
              active={gesture?.item.id === item.id}
              onRemove={() => {
                dispatch({ type: "remove", id: item.id });
                setAnnouncement(`${dimensions[item.kind].title} odebrán.`);
                editButton.current?.focus();
              }}
            />
          );
        })}
        {zoneOptions
          .filter((z) => !items.some((i) => i.zone === z.value))
          .map((z) => (
            <div
              key={z.value}
              className="dls-empty"
              data-layout-zone={z.value}
              style={{
                gridColumn:
                  z.value === "bottom" ? "1 / -1" : z.value === "left" ? 1 : 3,
                gridRow: z.value === "bottom" ? rows + 1 : 1,
              }}
            >
              <span className="ds-hint">
                {z.value === "bottom"
                  ? "Volný prostor pro další widgety"
                  : z.label}
              </span>
              <Button
                size="small"
                variant="ghost"
                icon={<Plus />}
                onClick={() => {
                  setEditing(true);
                  setAddOpen(true);
                }}
              >
                Přidat widget
                {z.value === "bottom" ? "" : ` · ${z.label.toLowerCase()}`}
              </Button>
            </div>
          ))}
      </div>
      <div className="dls-note">
        <span>
          {
            compositions.find((c) => c.value === layout.composition)
              ?.description
          }
        </span>
        <span>Rozložení se neukládá. Header nahoře je skutečný AppHeader.</span>
      </div>
      <p className="dls-announcement" role="status" aria-live="polite">
        {announcement}
      </p>
      {/* The add dialog remains reachable from an empty space before edit mode. */}
    </div>
  );
}
