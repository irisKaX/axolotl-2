import {ArrowUpRight,Trash2,Bookmark} from 'lucide-react';
import {Button as OriginalButton} from '../button-studio-01/Button';
import StarBorder from '../button-studio-01/vendor/StarBorder';

export function RailButton({rounded=false,variant='primary',size='m',star=false,disabled=false,loading=false,reduced=false,theme='dark',color='#7C3AED',duration=4,children,...props}){
 // Ghost always returns the exact original implementation, including its optional effect.
 if(!rounded||variant==='ghost')return <OriginalButton {...props} family="rail" {...{variant,size,star,disabled,loading,reduced,theme,color,duration}}>{children}</OriginalButton>;
 const effect=star&&!disabled&&!loading&&!reduced;
 if(!effect)return <OriginalButton {...props} family="rail" {...{variant,size,disabled,loading,reduced,theme,color,duration}} star={false} className="rail-rounded">{children}</OriginalButton>;
 const Icon=variant==='destructive'?Trash2:variant==='icon'?Bookmark:ArrowUpRight;
 return <StarBorder {...props} as="button" type="button" color={color} duration={duration} radius={100} theme={theme} stars={2} hover="brighten" clickPulse={false} sparkle={false} className="lab-button rail-rounded" data-family="rail" data-variant={variant} data-size={size} data-star="true" data-loading="false" data-success="false" aria-label={variant==='icon'?'Uložit do oblíbených':undefined}>
 {variant!=='icon'&&<span className="button-label">{children||(variant==='destructive'?'Odstranit soubor':'Spustit kontrolu')}</span>}
 <span className="button-icon" aria-hidden="true"><Icon size={16} strokeWidth={1.7}/></span>
 </StarBorder>;
}
