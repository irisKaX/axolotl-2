import {
  ComponentControl,
  PropertyControl,
  BooleanControl,
} from "./Controls";
import { findEntry, type PageProps } from "./registry";
import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "../../../design-system/Button";
import {
  Dialog,
  ConfirmationDialog,
  Popover,
  Tooltip,
  Field,
  Input,
  Select,
  Card,
  Status,
} from "../../../design-system/library";
import { Playground, Examples } from "./PageFrame";
export default function OverlaysPage({ category }: PageProps) {
  const [kind, setKind] = useState("Dialog"),
    [disabled, setDisabled] = useState(false),
    [size, setSize] = useState<"medium" | "large">("medium"),
    [name, setName] = useState("Můj workspace"),
    [area, setArea] = useState("private"),
    [message, setMessage] = useState("Připraveno."),
    [open, setOpen] = useState(false);
  const options = [
    { value: "private", label: "Soukromý" },
    { value: "shared", label: "Sdílený" },
  ];
  const fields = (
    <>
      <Field label="Název workspace">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Viditelnost">
        <Select value={area} onValueChange={setArea} options={options} />
      </Field>
      <Popover
        title="Nápověda k workspace"
        trigger={<Button>Nápověda v dialogu</Button>}
      >
        <p>Samostatný portál uvnitř modálního dialogu.</p>
        <Input aria-label="Poznámka v popoveru" placeholder="Vyzkoušej focus" />
      </Popover>
      <Button
        variant="primary"
        onClick={() => {
          setMessage(`Uloženo: ${name} (${area}).`);
          setOpen(false);
        }}
      >
        Uložit změny
      </Button>
    </>
  );
  const selectedEntry = findEntry(kind, [category]);
  return (
    <>
      <Playground
        controls={
          <>
            <ComponentControl
              category={category}
              value={kind}
              onValueChange={setKind}
            />
            <BooleanControl
              label="Disabled trigger"
              value={disabled}
              onValueChange={setDisabled}
            />
            {kind === "Dialog" && (
              <PropertyControl
                label="Velikost dialogu"
                entry={selectedEntry}
                property="size"
                value={size}
                onValueChange={(v) => setSize(v as typeof size)}
              />
            )}
            <p className="ds-hint">
              Escape zavře vrstvu a vrátí focus. Select uvnitř dialogu ověřuje
              skutečné vrstvení portálů.
            </p>
          </>
        }
      >
        {kind === "Dialog" ? (
          <Dialog
            open={open}
            onOpenChange={setOpen}
            size={size}
            title="Upravit workspace"
            description="Ukázka modálního dialogu s formulářem a vnořenými portály."
            trigger={
              <Button variant="primary" disabled={disabled}>
                Otevřít dialog
              </Button>
            }
          >
            {fields}
          </Dialog>
        ) : kind === "Confirmation Dialog" ? (
          <ConfirmationDialog
            title="Odstranit ukázkový soubor?"
            description="Akce mění pouze stav této ukázky. Výchozí focus je na Zrušit."
            confirmLabel="Odstranit soubor"
            onConfirm={async () => {
              await new Promise((r) => setTimeout(r, 500));
              setMessage("Ukázkový soubor byl odstraněn.");
            }}
            trigger={
              <Button variant="destructive" disabled={disabled}>
                Otevřít potvrzení
              </Button>
            }
          />
        ) : kind === "Popover" ? (
          <Popover
            title="Rychlé nastavení"
            trigger={<Button disabled={disabled}>Otevřít popover</Button>}
          >
            <Field label="Název v popoveru">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <p className="ds-hint">Změna zůstává v této stránce.</p>
          </Popover>
        ) : (
          <Tooltip text="Nápověda se zobrazí při hover i klávesnicovém focusu.">
            <Button icon={<HelpCircle />} disabled={disabled}>
              Zobrazit nápovědu
            </Button>
          </Tooltip>
        )}
        <p role="status">{message}</p>
      </Playground>
      <Examples title="Všechny vrstvy v kontextu">
        <Card title="Dialog">
          <Dialog
            title="Detail souboru"
            description="Focus zůstává uvnitř až do zavření."
            trigger={<Button>Otevřít detail</Button>}
          >
            <p>
              React portal, přístupný titulek a popis, Escape a návrat na
              trigger.
            </p>
            <Input
              aria-label="Poznámka k souboru"
              placeholder="Vlož poznámku"
            />
          </Dialog>
        </Card>
        <Card title="Confirmation Dialog">
          <ConfirmationDialog
            title="Vymazat lokální ukázku?"
            description="Jde pouze o demonstraci potvrzovacího kontraktu."
            onConfirm={() => setMessage("Lokální ukázka vymazána.")}
            confirmLabel="Vymazat"
            trigger={<Button variant="destructive">Potvrdit vymazání</Button>}
          />
        </Card>
        <Card title="Popover">
          <Popover
            title="Stav kontroly"
            trigger={<Button>Podrobnosti kontroly</Button>}
          >
            <Status state="success">Dokončeno bez chyb</Status>
            <Button onClick={() => setMessage("Podrobnosti byly přečteny.")}>
              Označit jako přečtené
            </Button>
          </Popover>
        </Card>
        <Card title="Tooltip">
          <Tooltip text="Spustí kontrolu pouze vybrané stránky.">
            <Button icon={<HelpCircle />}>Jak kontrola funguje</Button>
          </Tooltip>
          <p className="ds-hint">
            Tooltip doplňuje informaci; nezakrývá nutný popis akce.
          </p>
        </Card>
      </Examples>
    </>
  );
}
