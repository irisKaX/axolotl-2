import { useState } from "react";
import {
  Field,
  Input,
  Select,
  Switch,
  Slider,
  Tabs,
  SegmentedControl,
  Disclosure,
  Pagination,
  Card,
} from "../../../design-system/library";
import { Playground, Examples } from "./PageFrame";
export default function NavigationPage() {
  const [kind, setKind] = useState("Tabs"),
    [value, setValue] = useState("overview"),
    [disable, setDisable] = useState(false),
    [open, setOpen] = useState(false),
    [page, setPage] = useState(1),
    [count, setCount] = useState(8),
    [note, setNote] = useState("");
  const items = [
    {
      value: "overview",
      label: "Přehled",
      content: <p>Přehled vybraného workspace a jeho aktivit.</p>,
    },
    {
      value: "details",
      label: "Detaily",
      content: (
        <Field label="Poznámka v záložce">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      ),
    },
    {
      value: "history",
      label: "Historie",
      disabled: disable,
      content: <p>Poslední akce: aktualizace ukázky.</p>,
    },
  ];
  return (
    <>
      <Playground
        controls={
          <>
            <Field label="Komponenta">
              <Select
                value={kind}
                onValueChange={setKind}
                options={[
                  "Tabs",
                  "Segmented Control",
                  "Disclosure",
                  "Pagination",
                ].map((v) => ({ value: v, label: v }))}
              />
            </Field>
            {["Tabs", "Segmented Control"].includes(kind) && (
              <Switch
                label="Zakázat Historii"
                checked={disable}
                onChange={(e) => {
                  setDisable(e.target.checked);
                  if (value === "history") setValue("overview");
                }}
              />
            )}
            {kind === "Disclosure" && (
              <Switch
                label="Otevřená sekce"
                checked={open}
                onChange={(e) => setOpen(e.target.checked)}
              />
            )}{" "}
            {kind === "Pagination" && (
              <Slider
                label="Počet stránek"
                min={1}
                max={12}
                value={count}
                onValueChange={(v) => {
                  setCount(v);
                  setPage((p) => Math.min(v, p));
                }}
              />
            )}
            <p className="ds-hint">
              Šipky/Home/End přepínají Tabs. Segmented používá nativní radio
              šipky. Disclosure podporuje Enter a mezerník.
            </p>
          </>
        }
      >
        <div className="ds-catalog-wide-demo">
          {kind === "Tabs" ? (
            <Tabs
              items={items}
              value={value}
              onValueChange={setValue}
              label="Ukázkové záložky"
            />
          ) : kind === "Segmented Control" ? (
            <>
              <SegmentedControl
                items={items}
                value={value}
                onValueChange={setValue}
                label="Režim zobrazení"
              />
              <p role="status">
                Aktivní režim: {items.find((i) => i.value === value)?.label}
              </p>
            </>
          ) : kind === "Disclosure" ? (
            <Disclosure
              title="Jak se ukládají preference?"
              open={open}
              onOpenChange={setOpen}
            >
              <p>
                V této aplikaci se preference ukládají lokálně. Tato sekce je
                skutečné HTML details/summary.
              </p>
              <Input
                aria-label="Poznámka v rozbalené sekci"
                placeholder="Vyzkoušej Tab"
              />
            </Disclosure>
          ) : (
            <>
              <Pagination page={page} count={count} onPageChange={setPage} />
              <p role="status">
                Stránka {page} z {count} · položky {(page - 1) * 5 + 1}–
                {page * 5}
              </p>
              <ul>
                {Array.from({ length: 5 }, (_, i) => (
                  <li key={i}>Výsledek {(page - 1) * 5 + i + 1}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </Playground>
      <Examples>
        <Card title="Tabs">
          <Tabs
            label="Záložky v kartě"
            items={items}
            value={value}
            onValueChange={setValue}
          />
        </Card>
        <Card title="Segmented Control">
          <SegmentedControl
            label="Obsah karty"
            items={items}
            value={value}
            onValueChange={setValue}
          />
        </Card>
        <Card title="Disclosure">
          <Disclosure title="Informace k exportu">
            <p>
              Obsah je dostupný po rozbalení, bez změny route nebo hlavního
              headeru.
            </p>
          </Disclosure>
        </Card>
        <Card title="Pagination">
          <Pagination
            label="Stránkování v kartě"
            page={page}
            count={count}
            onPageChange={setPage}
          />
          <p>Aktuální stránka: {page}</p>
        </Card>
      </Examples>
    </>
  );
}
