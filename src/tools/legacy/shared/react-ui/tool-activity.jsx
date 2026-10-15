import { AlertTriangle, Check, Download, Hourglass, LoaderCircle, MousePointer2 } from 'lucide-react';
const icons={idle:Hourglass,ready:MousePointer2,working:LoaderCircle,download:Download,done:Check,error:AlertTriangle};
export function ToolActivity({phase='idle',label='Připraveno',detail,active=true}) {
 const Icon=icons[phase]||Hourglass;
 return <div className="tool-activity" data-phase={phase} data-active={active} role="status" aria-live="polite" aria-atomic="true" title={[label,detail].filter(Boolean).join(' · ')}>
  <span className="tool-activity-symbol" aria-hidden="true"><Icon size={19}/><span className="tool-activity-dot"/></span>
  <span className="tool-activity-copy"><strong>{label}</strong>{detail&&<small>{detail}</small>}</span>
 </div>;
}
