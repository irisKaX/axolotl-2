import { useEffect, useRef, useState } from 'react';
import DarkVeil from './vendor/DarkVeil';
import type { VeilSettings } from './main';

/** Upstream is unmodified. Fixed-size keyed hosts avoid reallocating its immutable GL texture. */
export function VeilBackground({ settings,light,reduced,paused,staticMode,generation,onStatus }: {settings:VeilSettings;light:boolean;reduced:boolean;paused:boolean;staticMode:boolean;generation:number;onStatus:(status:string)=>void}) {
  const host=useRef<HTMLDivElement>(null);
  const [size,setSize]=useState({width:0,height:0});
  const [failure,setFailure]=useState(false);
  const [systemReduced,setSystemReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fallback=reduced||systemReduced||staticMode||failure;
  const quality=Math.min(settings.quality,0.75);
  const key=`${size.width}:${size.height}:${quality}:${generation}`;
  useEffect(()=>setFailure(false),[generation]);
  useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setSystemReduced(q.matches);q.addEventListener('change',update);return()=>q.removeEventListener('change',update);},[]);
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>;
    const measure=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(host.current){const r=host.current.getBoundingClientRect();setSize({width:Math.round(r.width),height:Math.round(r.height)});}},120);};
    const observer=new ResizeObserver(measure);if(host.current)observer.observe(host.current);measure();
    return()=>{clearTimeout(timer);observer.disconnect();};
  },[]);
  useEffect(()=>{
    if(fallback||!size.width)return;
    const canvas=host.current?.querySelector('canvas');if(!canvas)return;
    let disposed=false;
    const lost=()=>{if(!disposed)setFailure(true);};canvas.addEventListener('webglcontextlost',lost);
    const timer=setTimeout(()=>{const gl=canvas.getContext('webgl2');if(!gl||gl.isContextLost()||!gl.getParameter(gl.CURRENT_PROGRAM))setFailure(true);},500);
    return()=>{disposed=true;clearTimeout(timer);canvas.removeEventListener('webglcontextlost',lost);};
  },[key,fallback,size.width]);
  useEffect(()=>{onStatus(failure?'WebGL nedostupné · statický režim':reduced||systemReduced?'Omezený pohyb · statický režim':staticMode?'Statický režim':paused?'Pohyb pozastaven':'Živé pozadí · WebGL2');},[failure,reduced,systemReduced,staticMode,paused,onStatus]);
  return <div ref={host} className="veil-background" aria-hidden="true" data-fallback={fallback} data-light={light}>
    <div className="veil-static"/>
    {!fallback&&size.width>0&&<DarkVeil key={key} {...settings} quality={quality} dpr={1} lightMode={light} mouseInteraction={false} intro={false} paused={paused} style={{width:size.width,height:size.height}}/>}
  </div>;
}
