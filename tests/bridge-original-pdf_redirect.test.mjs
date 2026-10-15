import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {verifyPdf} from '../browser-extension/background/network.js';

async function fixture(handler,check){
  const requests=[],server=createServer((req,res)=>{requests.push({url:req.url,method:req.method,cookie:req.headers.cookie||''});handler(req,res);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const originalFetch=globalThis.fetch,origin='http://127.0.0.1:'+server.address().port;
  // Node has no cookie jar; only this browser boundary is adapted. Redirects,
  // HTTP methods, response handling and the production verifier remain real.
  globalThis.fetch=(url,options={})=>{
    const headers=new Headers(options.headers);
    if(options.credentials==='include')headers.set('Cookie','session=active');
    return originalFetch(url,{...options,headers});
  };
  try{await check(origin,requests);}
  finally{globalThis.fetch=originalFetch;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}

for(const method of ['HEAD','GET'])test(`PDF ${method} probe refuses an authenticated redirect before requesting an action endpoint`,async()=>{
  await fixture((req,res)=>{
    if(req.url==='/document'&&method==='GET'&&req.method==='HEAD'){res.writeHead(405);res.end();return;}
    if(req.url==='/document'&&!req.headers.cookie){res.writeHead(403);res.end();return;}
    if(req.url==='/document'){res.writeHead(302,{Location:'/logout'});res.end();return;}
    res.writeHead(200,{'Content-Type':'text/html'});res.end('Logged out');
  },async(origin,requests)=>{
    const result=await verifyPdf(origin+'/document');
    assert.equal(requests.some(request=>request.url==='/logout'),false);
    assert.equal(result.status,'possible');
    assert.match(result.reason,/přesměrování/i);
  });
});

test('direct authenticated PDF remains verifiable after a public denial',async()=>{
  await fixture((req,res)=>{res.writeHead(req.headers.cookie?200:403,{'Content-Type':'application/pdf'});res.end();},async(origin)=>{
    assert.equal((await verifyPdf(origin+'/private.pdf')).status,'pdf');
  });
});
test('ordinary public PDF redirects never receive browser credentials',async()=>{
  await fixture((req,res)=>{
    if(req.url==='/document'){res.writeHead(302,{Location:'/document.pdf'});res.end();return;}
    res.writeHead(200,{'Content-Type':'application/pdf'});res.end();
  },async(origin,requests)=>{
    const result=await verifyPdf(origin+'/document');
    assert.equal(result.status,'pdf');assert.equal(result.filename,'document.pdf');
    assert.ok(requests.every(request=>!request.cookie));
  });
});

test('a direct PDF behind a 200 HTML login shell is retried with the existing session',async()=>{
  await fixture((req,res)=>{
    res.writeHead(200,{'Content-Type':req.headers.cookie?'application/pdf':'text/html'});
    res.end(req.headers.cookie?'%PDF-1.7':'<form><input type="password"></form>');
  },async(origin,requests)=>{
    const result=await verifyPdf(origin+'/private-document');
    assert.equal(result.status,'pdf');
    assert.equal(requests.length,2);
    assert.equal(requests[0].cookie,'');
    assert.equal(requests[1].cookie,'session=active');
  });
});

test('HTML document listings and HTML behind .pdf names are never accepted as verified PDF',async()=>{
  await fixture((req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Disposition':'inline; filename="documents.pdf"'});
    res.end('<!doctype html><title>Ceníky a dokumenty</title><a href="/real.pdf">Stáhnout PDF</a>');
  },async(origin)=>{
    for(const path of ['/osobni/ceniky-a-dokumenty','/misleading.pdf']){
      const result=await verifyPdf(origin+path);
      assert.equal(result.status,'other');
      assert.equal(result.contentType,'text/html');
    }
  });
});

test('a PDF-looking filename on an ambiguous binary response remains unverified',async()=>{
  await fixture((req,res)=>{
    res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="document.pdf"'});
    res.end('unknown content');
  },async(origin)=>{
    const result=await verifyPdf(origin+'/download');
    assert.equal(result.status,'possible');
    assert.equal(result.filename,'document.pdf');
  });
});
