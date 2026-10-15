import { Globe, LoaderCircle } from 'lucide-react';
import { ToolHeader } from './components.jsx';
import { ToolActivity } from './tool-activity.jsx';
export { ToolActivity } from './tool-activity.jsx';
export function WorkspaceCard({ id, title, children, wide = false, className = '' }) {
  return <section className={`workspace-card ${wide ? 'workspace-card-wide' : ''} ${className}`} data-card={id} aria-label={title}><div className="workspace-card-body">{children}</div></section>;
}
export function ToolHeading({ title, description, active, actions, activity }) {
  return <header className="tool-heading react-tool-heading"><ToolHeader title={title} description={description} actions={<div className="tool-heading-actions"><ToolActivity {...activity} active={active}/>{actions}</div>}/></header>;
}
export function Message({ id, value }) {
  return <p id={id} className={'notice '+(value?.kind||'info')} role="status" aria-live="polite" hidden={!value?.text}>{value?.text}</p>;
}
export function EmptyState({ icon: Icon, title, children }) {
  return <div className="empty-state"><span className="react-empty-icon"><Icon size={34} aria-hidden="true"/></span><h3>{title}</h3><p className="muted">{children}</p></div>;
}
export function PresentationStage({ variant='qr', children }) {
  return <div className={'ax-preview-stage ax-preview-stage--'+variant}>{children}</div>;
}
export function ScanIntro({ prefix, icon: Icon, title, description, button, hidden, busy }) {
  return <div className={'tool-intro '+prefix+'-intro'} hidden={hidden}>
    <div className={'tool-intro-visual '+prefix+'-intro-visual'} aria-hidden="true"><div className={'tool-intro-art '+prefix+'-intro-art'}>{busy?<LoaderCircle className="react-busy-icon icon"/>:<Icon className="icon"/>}</div></div>
    <div className="tool-entry-copy"><h3 className="tool-intro-title tool-entry-title">{title}</h3><p className="tool-intro-copy">{description}</p><p className="tool-intro-hint"><Globe size={15} aria-hidden="true"/><span>Z aktuálně vybrané stránky v horní liště</span></p></div>{button}
  </div>;
}
