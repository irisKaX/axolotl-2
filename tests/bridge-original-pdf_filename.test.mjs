import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {verifyPdf} from '../browser-extension/background/network.js';
test('PDF verification resolves real filenames from headers and redirect targets without inventing opaque names',async()=>{
 const server=createServer((req,res)=>{
  if(req.url==='/redirect'){res.writeHead(302,{Location:'/actual.pdf'});res.end();return;}
  const disposition={
   '/utf8':"attachment; filename=backup.pdf; filename*=UTF-8''Cen%C3%ADk%20z%C3%A1kladn%C3%ADch.pdf",
   '/quoted':'attachment; filename="terms (2026); final.pdf"',
   '/invalid':"attachment; filename=fallback.pdf; filename*=UTF-8''bad%ZZ.pdf",
   '/traversal':'attachment; filename="../../secret.pdf"'
  }[req.url];
  res.writeHead(200,{'Content-Type':'application/pdf',...(disposition?{'Content-Disposition':disposition}:{})});res.end();
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 try{
  for(const [path,expected] of [['/utf8','Ceník základních.pdf'],['/quoted','terms (2026); final.pdf'],['/invalid','fallback.pdf'],['/traversal','secret.pdf'],['/redirect','actual.pdf'],['/opaque','']]){
   const result=await verifyPdf(base+path);assert.equal(result.status,'pdf');assert.equal(result.filename,expected,path);
  }
 }finally{await new Promise(resolve=>server.close(resolve));}
});
