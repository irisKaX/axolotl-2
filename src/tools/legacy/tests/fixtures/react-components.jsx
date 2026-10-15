import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Button, Panel, ToolHeader } from '../../shared/react-ui/components.jsx';
import { Field, Select, Checkbox } from '../../shared/react-ui/fields.jsx';

function Fixture() {
  const [format, setFormat] = useState('png'), [checked, setChecked] = useState(false), [result, setResult] = useState('');
  return <main id="fixture" className="ax-ui" data-runtime-control="native" style={{maxWidth:480,margin:'40px auto',padding:24}}>
    <ToolHeader title="Společné komponenty" description="Ověření propojení s původním rozhraním." />
    <Panel style={{marginTop:20,display:'grid',gap:20}}>
      <Field id="filename" label="Název souboru" hint="Bez přípony."><input defaultValue="ukazka" /></Field>
      <Field id="format" label="Formát"><Select value={format} onValueChange={setFormat} options={[{value:'png',label:'PNG'},{value:'svg',label:'SVG'}]} /></Field>
      <Checkbox id="transparent" label="Bez pozadí" checked={checked} onCheckedChange={setChecked} />
      <Button variant="primary" onClick={()=>setResult(`${format} / ${checked ? 'průhledné' : 's pozadím'}`)}>Použít nastavení</Button>
      <output id="result" aria-live="polite">{result}</output>
    </Panel>
  </main>;
}
createRoot(document.getElementById('root')).render(<Fixture />);
