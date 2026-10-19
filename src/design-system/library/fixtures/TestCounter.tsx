import { Button } from "../../Button";
/** Technical extension fixture: an actual controlled export, never a production registration. */
export function TestCounter({
  value,
  onValueChange,
  disabled = false,
}: {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="ds-actions" role="group" aria-label="Testovací čítač">
      <Button
        disabled={disabled}
        aria-label="Snížit hodnotu"
        onClick={() => onValueChange(value - 1)}
      >
        −
      </Button>
      <output aria-label="Hodnota čítače">{value}</output>
      <Button
        disabled={disabled}
        aria-label="Zvýšit hodnotu"
        onClick={() => onValueChange(value + 1)}
      >
        +
      </Button>
    </div>
  );
}
