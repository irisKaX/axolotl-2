import { useRef, useState } from "react";
import { Button } from "../../../design-system/Button";
import {
  Field,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  Slider,
  Card,
  type ControlSize,
} from "../../../design-system/library";
import { Playground, Examples } from "./PageFrame";
const kinds = [
  "Input",
  "Textarea",
  "Select",
  "Checkbox",
  "Radio",
  "Switch",
  "Slider",
];
const options = [
  { value: "workspace", label: "Workspace" },
  { value: "tools", label: "Tools" },
  { value: "archive", label: "Archiv (nedostupný)", disabled: true },
];
export default function FormsPage() {
  const [kind, setKind] = useState("Input"),
    [size, setSize] = useState<ControlSize>("medium"),
    [disabled, setDisabled] = useState(false),
    [invalid, setInvalid] = useState(false),
    [type, setType] = useState("text");
  const [text, setText] = useState("Axolotl workspace"),
    [selected, setSelected] = useState("workspace"),
    [checked, setChecked] = useState<boolean | "indeterminate">(false),
    [enabled, setEnabled] = useState(false),
    [range, setRange] = useState(40);
  const [email, setEmail] = useState(""),
    [agree, setAgree] = useState<boolean | "indeterminate">(false),
    [attempted, setAttempted] = useState(false),
    [saved, setSaved] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const emailError =
    attempted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Zadej platný e-mail, například iris@example.cz."
      : undefined;
  const hint = invalid ? "Tato hodnota vyžaduje opravu." : undefined;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    setSaved("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailRef.current?.focus();
      return;
    }
    if (agree !== true) {
      document.getElementById("library-agreement")?.focus();
      return;
    }
    setSaved(
      `Ukázkový formulář uložen pro ${email}. Data neopouštějí tuto stránku.`,
    );
  }
  return (
    <>
      <Playground
        controls={
          <>
            <Field label="Komponenta">
              <Select
                value={kind}
                onValueChange={setKind}
                options={kinds.map((k) => ({ value: k, label: k }))}
              />
            </Field>
            {["Input", "Textarea", "Select"].includes(kind) && (
              <Field label="Velikost">
                <Select
                  value={size}
                  onValueChange={(v) => setSize(v as ControlSize)}
                  options={["small", "medium", "large"].map((v) => ({
                    value: v,
                    label: v,
                  }))}
                />
              </Field>
            )}
            {kind === "Input" && (
              <Field label="Typ hodnoty">
                <Select
                  value={type}
                  onValueChange={setType}
                  options={["text", "email", "url"].map((v) => ({
                    value: v,
                    label: v,
                  }))}
                />
              </Field>
            )}
            <Switch
              label="Disabled"
              checked={disabled}
              onChange={(e) => setDisabled(e.target.checked)}
            />
            <Switch
              label="Invalid"
              checked={invalid}
              onChange={(e) => setInvalid(e.target.checked)}
            />
            {kind === "Checkbox" && (
              <Button onClick={() => setChecked("indeterminate")}>
                Nastavit indeterminate
              </Button>
            )}
            <p className="ds-hint">
              Focus vyzkoušej klávesou Tab. Ovládání mění skutečné props
              zvoleného exportu.
            </p>
          </>
        }
      >
        <div className="ds-catalog-field-demo" data-demo="form">
          {kind === "Input" ? (
            <Field
              label="Název nebo adresa"
              hint="Uprav hodnotu přímo v poli."
              error={hint}
            >
              <Input
                size={size}
                type={type}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={disabled}
              />
            </Field>
          ) : kind === "Textarea" ? (
            <Field
              label="Poznámka"
              error={hint}
              hint="Text se průběžně aktualizuje."
            >
              <Textarea
                size={size}
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={disabled}
              />
            </Field>
          ) : kind === "Select" ? (
            <Field
              label="Cílová oblast"
              error={hint}
              hint="Archiv je disabled; lze zkoušet také psaní a šipky."
            >
              <Select
                size={size}
                value={selected}
                onValueChange={setSelected}
                options={options}
                disabled={disabled}
              />
            </Field>
          ) : kind === "Checkbox" ? (
            <Checkbox
              label="Zahrnout do výběru"
              checked={checked}
              onCheckedChange={setChecked}
              disabled={disabled}
              error={hint}
            />
          ) : kind === "Radio" ? (
            <RadioGroup
              label="Cílová oblast"
              options={options}
              value={selected}
              onValueChange={setSelected}
              disabled={disabled}
              error={hint}
            />
          ) : kind === "Switch" ? (
            <Switch
              label="Synchronizace ukázky"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={disabled}
              error={hint}
            />
          ) : (
            <Slider
              label="Intenzita náhledu"
              value={range}
              onValueChange={setRange}
              disabled={disabled}
              error={hint}
            />
          )}
        </div>
        <output aria-label="Aktuální hodnota">
          Hodnota:{" "}
          {["Input", "Textarea"].includes(kind)
            ? text
            : ["Select", "Radio"].includes(kind)
              ? selected
              : kind === "Checkbox"
                ? String(checked)
                : kind === "Switch"
                  ? String(enabled)
                  : range}
        </output>
      </Playground>
      <Examples title="Všechny prvky a skutečná validace">
        <Card title="Formulář v kontextu">
          <form className="ds-catalog-stack" onSubmit={submit} noValidate>
            <Field
              label="E-mail"
              error={emailError}
              hint="Pouze lokální ukázka validace."
            >
              <Input
                ref={emailRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Checkbox
              id="library-agreement"
              label="Souhlasím s uložením ukázky"
              checked={agree}
              onCheckedChange={setAgree}
              error={
                attempted && agree !== true
                  ? "Pro pokračování potvrď souhlas."
                  : undefined
              }
            />
            <Button type="submit" variant="primary">
              Uložit formulář
            </Button>
            <p role="status">{saved}</p>
          </form>
        </Card>
        <Card title="Výběr a preference">
          <div className="ds-catalog-stack">
            <Field label="Oblast ukázky">
              <Select
                value={selected}
                onValueChange={setSelected}
                options={options}
              />
            </Field>
            <RadioGroup
              label="Zobrazení"
              options={[
                { value: "workspace", label: "Workspace" },
                { value: "tools", label: "Tools" },
              ]}
              value={selected}
              onValueChange={setSelected}
            />
            <Switch
              label="Zapnout náhled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <Slider label="Úroveň" value={range} onValueChange={setRange} />
          </div>
        </Card>
        <Card title="Delší obsah">
          <Field
            label="Popis workspace"
            hint="Textarea lze zvětšit tažením za roh."
          >
            <Textarea value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
        </Card>
      </Examples>
    </>
  );
}
