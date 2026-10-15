import { useEffect, useRef, useSyncExternalStore } from 'react';
import { RefreshCw, SearchCheck, Square } from 'lucide-react';
import { mountReactTool } from '../react-ui/mount-tool.jsx';
import { Button } from '../react-ui/components.jsx';
import { Message, ScanIntro, ToolHeading } from '../react-ui/tool-parts.jsx';
import { AuditController } from './controller.js';

export function mountAuditTool(root, app, options) {
  const { id, title, description, Results, help, icon: Icon = SearchCheck } = options;
  root.classList.add('audit-tool');
  const controller = new AuditController(app, options);
  function AuditView({ active }) {
    const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
    const heading = useRef(null), button = useRef(null), restore = useRef(false), wasRunning = useRef(false);
    useEffect(() => {
      if (wasRunning.current && !state.running && restore.current && active) {
        (state.scanned ? heading.current : button.current)?.focus({ preventScroll: true }); restore.current = false;
      }
      wasRunning.current = state.running;
    }, [state.running, state.scanned, active]);
    const scan = () => { restore.current = true; void controller.scan(); };
    const focused = options.presentation === 'focused';
    const controls = <div className="audit-toolbar-actions">{state.scanned && <Button id={id+'-rescan'} disabled={state.running} onClick={scan}><RefreshCw size={18} aria-hidden="true"/>Zkontrolovat znovu</Button>}{state.running && <Button id={id+'-cancel'} onClick={() => controller.cancel()}><Square size={16} aria-hidden="true"/>Zastavit</Button>}</div>;
    return <>
      <ToolHeading id={id} title={title} description={description} active={active} activity={state.running ? {phase:'working',label:'Probíhá kontrola',detail:title} : state.message?.kind==='error' ? {phase:'error',label:'Kontrola se nezdařila',detail:'Podrobnosti najdete níže'} : state.scanned ? {phase:'done',label:'Výsledky jsou připravené',detail:'Prohlédněte si nalezené údaje'} : {phase:'idle',label:'Čekám na spuštění',detail:'Spusťte kontrolu vybrané stránky'}} actions={focused && (state.scanned || state.running) ? controls : undefined}/>

      <div className="audit-workspace" aria-busy={state.running}>
        {!state.scanned && <section className="audit-panel audit-intro"><ScanIntro prefix={id} icon={Icon} title={title} description={description} busy={state.running} button={<Button ref={button} id={id+'-scan'} variant="primary" className="tool-start" disabled={state.running} onClick={scan}><Icon size={18} aria-hidden="true"/>{state.running ? 'Kontroluji…' : 'Zkontrolovat stránku'}</Button>}/></section>}
        {!focused && (state.scanned || state.running) && <div className="audit-toolbar"><div ref={heading} tabIndex={-1} className="audit-source"><strong>{state.running ? 'Probíhá kontrola stránky…' : 'Výsledky kontroly'}</strong>{state.sourceUrl && <span title={state.sourceUrl}>{state.sourceUrl}</span>}{state.scannedAt && <small>{state.running ? 'Předchozí kontrola' : 'Zkontrolováno'}: {new Date(state.scannedAt).toLocaleTimeString('cs-CZ')}</small>}</div><div className="audit-toolbar-actions">{state.scanned && <Button id={id+'-rescan'} disabled={state.running} onClick={scan}><RefreshCw size={16} aria-hidden="true"/>Zkontrolovat znovu</Button>}{state.running && <Button id={id+'-cancel'} onClick={() => controller.cancel()}><Square size={14} aria-hidden="true"/>Zastavit</Button>}</div></div>}
        {focused && <div ref={heading} tabIndex={-1} className={state.running ? 'structured-running' : 'workspace-sr-only'} role="status">{state.running ? 'Probíhá kontrola stránky…' : 'Výsledky kontroly'}</div>}
        <Message id={id+'-status'} value={state.message}/>
        {state.scanned && <Results key={state.revision} result={state.result} state={state} controller={controller} app={app} active={active} help={help}/>}
      </div>
    </>;
  }
  const lifecycle = mountReactTool(root, app, AuditView);
  return { ...lifecycle, scanCurrent: () => controller.scan(),
    onHide() { controller.cancel(); lifecycle.onHide(); },
    onTargetChange(target) { controller.onTargetChange(); lifecycle.onTargetChange(target); },
    destroy() { controller.destroy(); lifecycle.destroy(); }
  };
}
