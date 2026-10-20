import { useState } from "react";
import { ArrowUpRight, Check, Settings } from "lucide-react";
import { Button } from "../../../design-system/Button";
import {
  DesignSystemProvider,
  Field,
  Input,
  Select,
  Checkbox,
  Card,
  InteractiveCard,
  Dialog,
  Popover,
  Badge,
  Status,
  Alert,
  Progress,
  Tabs,
} from "../../../design-system/library";
import { getPaint } from "./colors/paints";
import "./system-overview.css";
function Specimens({ theme }: { theme: "dark" | "light" }) {
  const [tab, setTab] = useState("overview"),
    [checked, setChecked] = useState(false),
    [value, setValue] = useState("draft"),
    [selected, setSelected] = useState(false),
    [open, setOpen] = useState(false),
    [actions, setActions] = useState(0);
  return (
    <DesignSystemProvider theme={theme} appearance="unified">
      <div className="ds-system-column" data-system-theme={theme}>
        <header>
          <h3>{theme === "dark" ? "Dark" : "Light"}</h3>
          <p>Stejné komponenty, vlastní kontext tématu.</p>
        </header>
        <section aria-label={`Buttons · ${theme}`}>
          <h4>01 / Buttons</h4>
          <div className="ds-actions">
            <Button
              variant="primary"
              icon={<ArrowUpRight />}
              onClick={() => setActions((n) => n + 1)}
            >
              Spustit
            </Button>
            <Button
              variant="secondary"
              onClick={() => setActions((n) => n + 1)}
            >
              Uložit
            </Button>
            <Button variant="ghost" onClick={() => setActions((n) => n + 1)}>
              Více
            </Button>
            <Button
              variant="icon"
              aria-label={`Aktivovat nastavení ukázky ${theme}`}
              icon={<Settings />}
              onClick={() => setActions((n) => n + 1)}
            />
          </div>
          <p className="ds-hint" role="status">
            Aktivace: {actions}
          </p>
        </section>
        <section aria-label={`Inputs & Forms · ${theme}`}>
          <h4>02 / Inputs & Forms</h4>
          <div className="ds-system-fields">
            <Field label={`Název projektu · ${theme}`}>
              <Input defaultValue="Nový workspace" />
            </Field>
            <Field label={`Stav projektu · ${theme}`}>
              <Select
                value={value}
                onValueChange={setValue}
                options={[
                  { value: "draft", label: "Návrh" },
                  { value: "ready", label: "Připraveno" },
                ]}
              />
            </Field>
          </div>
          <Checkbox
            label="Zahrnout do přehledu"
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
          />
        </section>
        <section aria-label={`Cards & Surfaces · ${theme}`}>
          <h4>03 / Cards & Surfaces</h4>
          <Card
            title="Halo Soft"
            footer={<Status state="success">Kontrola dokončena</Status>}
          >
            <p>Klidný povrch pro obsah, nástroje a pracovní plochy.</p>
          </Card>
          <InteractiveCard
            title="Kontrola obsahu"
            description={
              selected ? "Vybráno do pracovní sady" : "Vyber do pracovní sady"
            }
            aria-pressed={selected}
            onClick={() => setSelected(!selected)}
          />
        </section>
        <section aria-label={`Dialogs & Popovers · ${theme}`}>
          <h4>04 / Dialogs & Popovers</h4>
          <div className="ds-actions">
            <Popover
              trigger={<Button variant="ghost">Rychlá volba</Button>}
              title="Pracovní kontext"
            >
              <p>Stejný povrch, focus a typografie i v portálu.</p>
              <Checkbox
                label="Ponechat otevřené poznámky"
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
              />
            </Popover>
          </div>
          <Dialog
            trigger={<Button>Otevřít dialog</Button>}
            open={open}
            onOpenChange={setOpen}
            title="Nastavení ukázky"
            description="Izolovaný dialog s vlastními providery."
          >
            <Field label="Popis projektu">
              <Input defaultValue="Kontrola vizuální jednoty" />
            </Field>
            <Button onClick={() => setOpen(false)} icon={<Check />}>
              Hotovo
            </Button>
          </Dialog>
        </section>
        <section aria-label={`Feedback & Status · ${theme}`}>
          <h4>05 / Feedback & Status</h4>
          <div className="ds-actions">
            <Badge>Metadata</Badge>
            <Badge tone="success">Hotovo</Badge>
            <Status state="warning">Čeká na kontrolu</Status>
          </div>
          <Alert tone="info" title="Vše na svém místě">
            Sémantické barvy zůstávají součástí systému.
          </Alert>
          <Progress value={72} label="Dokončení kontroly" />
        </section>
        <section aria-label={`Navigation & Tabs · ${theme}`}>
          <h4>06 / Navigation & Tabs · reference</h4>
          <Tabs
            label={`Referenční záložky ${theme}`}
            value={tab}
            onValueChange={setTab}
            items={[
              {
                value: "overview",
                label: "Přehled",
                content: <p>Přehled projektu a jeho aktivit.</p>,
              },
              {
                value: "details",
                label: "Detaily",
                content: <p>Obsah navazuje na vybranou záložku.</p>,
              },
              {
                value: "history",
                label: "Historie",
                disabled: true,
                content: null,
              },
            ]}
          />
        </section>
        <section aria-label={`Colors & Gradients · ${theme}`}>
          <h4>07 / Colors & Gradients</h4>
          <div className="ds-system-paints">
            {["axolotl-violet", "o2-blue", "electric-violet"].map((id) => {
              const p = getPaint(id);
              return (
                <div key={id}>
                  <span aria-hidden="true" style={{ background: p.css }} />
                  <strong>{p.name}</strong>
                  <code>{p.css}</code>
                </div>
              );
            })}
          </div>
          <p className="ds-hint">
            Přesné hodnoty a kopírování jsou v Colors & Gradients.
          </p>
        </section>
      </div>
    </DesignSystemProvider>
  );
}
export function SystemOverview() {
  return (
    <section
      className="ds-system-overview"
      aria-label="Vizuální přehled Design Systemu"
    >
      <header>
        <h2>Jeden systém. Dva kontexty.</h2>
        <p>
          Srovnání základních kategorií se skutečnými React exporty. Ukázky
          lze ovládat, jejich motiv nemění preference aplikace.
        </p>
      </header>
      <div className="ds-system-columns">
        <Specimens theme="dark" />
        <Specimens theme="light" />
      </div>
    </section>
  );
}
