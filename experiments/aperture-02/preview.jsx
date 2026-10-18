import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Field, Select} from '../../src/tools/legacy/shared/react-ui/fields.jsx';
import '../../src/styles/base.css';
import '../../src/styles/design-tokens.css';
import '../../src/styles/tools/base.css';
import '../../src/tools/legacy/shared/react-ui/components.css';
import '../../src/styles/tools/current-design.css';
import './preview.css';

function Example(){
 const [config,setConfig]=useState({theme:'dark',scenario:'default',text:100,motion:true,reset:0});
 const [value,setValue]=useState('png');
 const [open,setOpen]=useState(false);
 const report=(type,value)=>parent.postMessage({channel:'axo-catalog-example',type,value},'*');
 useEffect(()=>{const receive=e=>{if(e.source!==parent || e.data?.channel!=='axo-catalog-control')return;
 if(e.data.type==='focus'){document.querySelector('[role=combobox]')?.focus();return;}
 const c=e.data.config;if(!c||!['dark','light'].includes(c.theme)||!['default','long','disabled-option','disabled','error'].includes(c.scenario)||![100,115].includes(c.text))return;
 setConfig(c);};window.addEventListener('message',receive);report('ready',true);return()=>window.removeEventListener('message',receive);},[]);
 useEffect(()=>{const onKey=e=>{if(e.key==='Escape'&&!document.querySelector('[role=listbox]'))report('escape',true);};document.addEventListener('keydown',onKey,true);return()=>document.removeEventListener('keydown',onKey,true);},[]);
 useEffect(()=>{document.documentElement.dataset.theme=config.theme;document.documentElement.dataset.motion=config.motion?'full':'reduced';document.documentElement.style.setProperty('--axolotl-text-scale',String(config.text/100));},[config]);
 useEffect(()=>{setOpen(false);setValue('png');report('value','png');},[config.reset,config.scenario]);
 const options=[{value:'png',label:config.scenario==='long'?'PNG — bezztrátový obrázek s průhledným pozadím':'PNG'},{value:'svg',label:config.scenario==='long'?'SVG — vektorová grafika pro libovolné rozlišení':'SVG',disabled:config.scenario==='disabled-option'},{value:'webp',label:config.scenario==='long'?'WebP — optimalizovaný obrázek pro web':'WebP'}];
 return <main className="example-layout" data-scenario={config.scenario}><div className="example-caption"><span>AXOLOTL / TOOLS</span><span>SKUTEČNÉ UI · UKÁZKOVÁ DATA</span></div><div className="example-control ax-ui axolotl-tool-root"><Field label="Formát exportu" hint="Vyber formát výsledného souboru." error={config.scenario==='error'?'Tento formát není pro ukázkový export dostupný.':undefined}><Select value={value} onValueChange={v=>{setValue(v);report('value',v);}} options={options} disabled={config.scenario==='disabled'} open={open} onOpenChange={v=>{setOpen(v);report('open',v);}}/></Field></div><div className="example-foot"><span>Radix Select</span><span>{config.scenario==='disabled'?'Ovládání je zakázané':'Tab → fokus · Enter → nabídka'}</span></div></main>;
}
class Boundary extends React.Component{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div role="alert">Příklad se nepodařilo načíst. Použij Obnovit v panelu vlastností.</div>:this.props.children;}}
createRoot(document.getElementById('example')).render(<Boundary><Example/></Boundary>);
