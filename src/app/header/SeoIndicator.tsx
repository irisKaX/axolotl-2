import * as Tooltip from '@radix-ui/react-tooltip';
import {usePreferences} from '../PreferencesProvider';
import {useRobotsStatus} from './useRobotsStatus';
import s from './header.module.css';
export function SeoIndicator({draft}:{draft:string}) {
  const result=useRobotsStatus(draft);
  const {resolvedTheme}=usePreferences();
  const summary=`Indexace stránky · Googlebot (web). Index: ${result.index}. Follow: ${result.follow}. Zdroj kontroly: ${result.source}. ${result.reason}`;
  return <Tooltip.Provider delayDuration={150}><Tooltip.Root>
    <Tooltip.Trigger asChild><span tabIndex={0} role="img" aria-label={summary} className={s.seoIndicator} data-header-seo={result.state}><span aria-hidden="true"/></span></Tooltip.Trigger>
    <Tooltip.Portal><Tooltip.Content className={`${s.scope} ${s.seoTooltip}`} data-header-theme={resolvedTheme} side="bottom" sideOffset={12} collisionPadding={16}>
      <strong>Indexace stránky</strong><span>Googlebot (web)</span>
      <span>Index: {result.index}</span><span>Follow: {result.follow}</span><span>Zdroj kontroly: {result.source}</span><span>{result.reason}</span>
      <small>Nejde o potvrzení indexace v Googlu.</small>
    </Tooltip.Content></Tooltip.Portal>
  </Tooltip.Root></Tooltip.Provider>;
}
