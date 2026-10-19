import { useState } from "react";
import { TestCounter } from "../../../../design-system/library/fixtures/TestCounter";
import { BooleanControl } from "../Controls";
import { Playground } from "../PageFrame";
export default function TestCounterPage() {
  const [value, setValue] = useState(0),
    [disabled, setDisabled] = useState(false);
  return (
    <Playground
      controls={
        <BooleanControl
          label="Disabled"
          value={disabled}
          onValueChange={setDisabled}
        />
      }
    >
      <TestCounter value={value} onValueChange={setValue} disabled={disabled} />
      <p>Návrh · pouze technický test nového typu komponenty.</p>
    </Playground>
  );
}
