export function collectMetadata() {
  return {url:location.href,titles:Array.from(document.querySelectorAll('title')).filter(el=>el.namespaceURI==='http://www.w3.org/1999/xhtml').map(el=>el.textContent),descriptions:Array.from(document.querySelectorAll('meta[name]')).filter(el=>el.getAttribute('name').toLowerCase()==='description').map(el=>el.getAttribute('content')??''),truncated:false};
}
