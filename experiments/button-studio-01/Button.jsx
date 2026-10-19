import {forwardRef} from 'react';
import {ArrowUpRight, Play, Trash2, LoaderCircle, Check, Bookmark} from 'lucide-react';
import StarBorder from './vendor/StarBorder';

export const families=[
 {id:'milled',name:'Milled',no:'01',tag:'Machined precision',description:'Pevná hrana. Hmatatelný stisk.',detail:'Zapuštěné čelo, jemně frézovaný okraj a krátký mechanický zdvih. Přesný každodenní nástroj.'},
 {id:'lens',name:'Lens',no:'02',tag:'Optical softness',description:'Měkké světlo. Plynulý pohyb.',detail:'Optický povrch, oblá silueta a ikona v samostatné čočce. Klidnější, prostorový charakter.'},
 {id:'rail',name:'Rail',no:'03',tag:'Studio utility',description:'Grafický rytmus. Jasný příkaz.',detail:'Rovná konstrukce, monospace sazba a oddělená akční komora. Charakter digitálního studia.'}
];
export const variants=['primary','secondary','ghost','icon','destructive'];
export const names={primary:'Primary',secondary:'Secondary',ghost:'Ghost',icon:'Icon',destructive:'Destructive'};
export const Button=forwardRef(function Button({family='milled',variant='primary',size='m',star=false,color='#7C3AED',duration=4,theme='dark',reduced=false,disabled=false,loading=false,success=false,children,label,icon:CustomIcon,className='',...props},ref){
 const Icon=loading?LoaderCircle:success?Check:CustomIcon||(variant==='destructive'?Trash2:variant==='icon'?Bookmark:family==='rail'?ArrowUpRight:Play);
 const text=children||(variant==='destructive'?'Odstranit soubor':'Spustit kontrolu');
 const effect=star&&!disabled&&!loading&&!reduced;
 // The unmodified upstream component owns its animation and canvas. Only its public API and className are used.
 const Component=effect?StarBorder:'button';
 const starProps=effect?{color,duration,radius:family==='lens'?100:family==='rail'?2:9,theme,stars:2,hover:'brighten',clickPulse:false,sparkle:false}:{};
 return <Component {...starProps} {...props} ref={effect?undefined:ref} type={props.type||'button'} disabled={disabled||loading} aria-busy={loading||undefined} aria-label={variant==='icon'?(loading?'Probíhá akce':label||'Uložit do oblíbených'):label} data-family={family} data-variant={variant} data-size={size} data-star={star} data-loading={loading} data-success={success} className={`lab-button ${className}`}>
  {variant!=='icon'&&<span className="button-label">{loading?'Probíhá kontrola':success?'Hotovo':text}</span>}
  <span className="button-icon" aria-hidden="true"><Icon size={16} strokeWidth={1.7} className={loading?'spinner':''}/></span>
 </Component>;
});
