import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from './components.jsx';
export function Filename({name,disabled,onRename}){
 const [editing,setEditing]=useState(false),[value,setValue]=useState(name),[error,setError]=useState('');
 const input=useRef(null),trigger=useRef(null),cancelled=useRef(false);
 useEffect(()=>{if(editing){input.current?.focus();input.current?.select();}},[editing]);
 function commit(focus=false){if(!editing||cancelled.current)return;try{onRename(value);setEditing(false);setError('');if(focus)requestAnimationFrame(()=>trigger.current?.focus());}catch(reason){setError(reason.message);}}
 return <div className="filename-editor react-filename"><Button ref={trigger} variant="ghost" className="filename-name" hidden={editing} disabled={disabled} title={name} aria-label={'Přejmenovat: '+name} onClick={()=>{cancelled.current=false;setValue(name);setEditing(true);}}><span className="filename-name__text">{name}</span><Pencil className="filename-name__pencil" size={14} aria-hidden="true"/></Button>{editing&&<input ref={input} className="filename-input" aria-label="Název souboru" aria-invalid={!!error} value={value} disabled={disabled} onChange={event=>setValue(event.target.value)} onBlur={()=>commit()} onKeyDown={event=>{if(event.nativeEvent.isComposing)return;if(event.key==='Enter'){event.preventDefault();commit(true);}if(event.key==='Escape'){event.preventDefault();cancelled.current=true;setEditing(false);setError('');requestAnimationFrame(()=>trigger.current?.focus());}}}/>}<p className="filename-error" role="alert" hidden={!error}>{error}</p></div>;
}
