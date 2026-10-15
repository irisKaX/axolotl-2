// Keep source text intact. Tokens are rendered only as React text children.
export function jsonTokens(text){
 try{JSON.parse(text);}catch{return [{kind:'plain',text}];}
 const pattern=/"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|[{}\[\]:,]/g;
 const tokens=[];let end=0;
 for(const match of text.matchAll(pattern)){
  if(match.index>end)tokens.push({kind:'plain',text:text.slice(end,match.index)});
  const value=match[0];end=match.index+value.length;
  const kind=value[0]==='"'?(/^\s*:/.test(text.slice(end))?'key':'string'):/^-?\d/.test(value)?'number':value==='null'?'null':value==='true'||value==='false'?'boolean':'punctuation';
  tokens.push({kind,text:value});
 }
 if(end<text.length)tokens.push({kind:'plain',text:text.slice(end)});
 return tokens;
}
