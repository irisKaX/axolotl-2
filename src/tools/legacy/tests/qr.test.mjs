import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import jsQR from 'jsqr';

const moduleUrl = new URL('../tools/qr-generator/model.js', import.meta.url);
async function model() {
  assert.ok(existsSync(moduleUrl), 'QR generator model must exist');
  return import(moduleUrl);
}

// Independent decoder reads rendered pixels, not the encoder's input fields.
function decode(qr, paintQr) {
  const data = new Uint8ClampedArray(qr.size * qr.size * 4);
  const ctx = {
    fillStyle: '',
    clearRect() { data.fill(0); },
    fillRect(x, y, w, h) {
      const rgb = this.fillStyle.match(/[a-f0-9]{2}/gi).map(v => parseInt(v, 16));
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
        data.set([...rgb, 255], (yy * qr.size + xx) * 4);
      }
    },
  };
  paintQr(ctx, qr);
  const composited = data.map((v,i) => i%4===3 ? 255 : Math.round(v*data[i-i%4+3]/255+255*(1-data[i-i%4+3]/255)));
  const result = jsQR(composited, qr.size, qr.size);
  assert.ok(result, 'Export must decode as a QR code');
  return {result, data};
}

test('QR URL normalization preserves query/fragment and rejects unsupported schemes', async () => {
  const {createQr} = await model();
  assert.equal(createQr(' example.cz/cesta?x=1&y=2#část ').text, 'https://example.cz/cesta?x=1&y=2#%C4%8D%C3%A1st');
  for (const value of ['', '   ', 'obyčejný text', 'javascript:alert(1)', 'data:text/plain,x', 'ftp://example.cz', 'https://', 'https://exa\nmple.cz']) {
    assert.throws(() => createQr(value), /odkaz|URL|obsah/i);
  }
});

test('transparent QR clears old pixels and exports only opaque modules, including an empty quiet zone', async () => {
  const {createQr, paintQr, toSvg} = await model();
  const qr = createQr('https://www.o2.cz/', {background:{type:'transparent'}});
  const {result,data} = decode(qr, paintQr);
  assert.equal(result.data, 'https://www.o2.cz/');
  assert.deepEqual(Array.from(data.slice(0,4)),[0,0,0,0]);
  assert.ok(data.some((v,i)=>i%4===3&&v===255));
  assert.doesNotMatch(toSvg(qr), /<rect|linearGradient/);
  let cleared=false;
  paintQr({clearRect(){cleared=true;},fillRect(){assert.ok(cleared);}},qr);
});

test('solid background and contrasting light modules work together', async () => {
  const {createQr,paintQr,toSvg}=await model();
  const qr=createQr('https://www.o2.cz/',{color:'#FFFFFF',background:{type:'solid',color:'#102040'}});
  assert.equal(qr.color,'#ffffff');
  const {data,result}=decode(qr,paintQr);
  assert.equal(result.data,'https://www.o2.cz/');
  assert.deepEqual(Array.from(data.slice(0,4)),[16,32,64,255]);
  assert.match(toSvg(qr),/fill="#102040"/);
});

test('gradient settings and SVG preserve both colors and direction without injecting payload', async () => {
  const {createQr,toSvg}=await model();
  const qr=createQr('<img src=x>',{kind:'text',background:{type:'gradient',color:'#FFE4F6',colorEnd:'#DEF2FF',angle:90}});
  assert.deepEqual(qr.background,{type:'gradient',color:'#ffe4f6',colorEnd:'#def2ff',angle:90});
  const svg=toSvg(qr);
  assert.match(svg,/<linearGradient/);
  assert.match(svg,/stop-color="#ffe4f6"/);
  assert.match(svg,/stop-color="#def2ff"/);
  assert.ok(!svg.includes('<img'));
});

test('background validation checks gradient contrast and rejects unsupported or unsafe settings', async () => {
  const {createQr}=await model();
  for(const background of [{type:'unknown'},{type:'solid',color:'red'},{type:'solid',color:'#000000'},
    {type:'gradient',color:'#ffffff',colorEnd:'#000000',angle:90},
    {type:'gradient',color:'#ffffff',colorEnd:'#eeeeee',angle:NaN},
    {type:'gradient',color:'#ffffff',colorEnd:'#eeeeee',angle:'90" onload="x'}]) {
    assert.throws(()=>createQr('ok',{kind:'text',background}),/pozad|barv|kontrast|úhel/i);
  }
  assert.doesNotThrow(()=>createQr('ok',{kind:'text',color:'#ffffff',background:{type:'transparent'}}));
});

test('QR accepts protocol-less domain and localhost ports without allowing other URI schemes', async () => {
  const {createQr} = await model();
  for (const value of ['example.cz:8080/path?x=1#f', 'localhost:3000', '127.0.0.1:3000', '[::1]:3000']) {
    assert.equal(createQr(value).text, new URL('https://' + value).href);
  }
  for (const value of ['javascript:1234', 'mailto:1234', 'tel:1234', 'ftp://example.cz:21']) {
    assert.throws(() => createQr(value), /odkaz|URL/i);
  }
});

test('QR accepts exactly 2000 UTF-8 bytes and still decodes a dense export', async () => {
  const {createQr, paintQr} = await model();
  for (const text of ['p'.repeat(2000), 'ž'.repeat(1000)]) {
    const qr = createQr(text, {kind:'text', size:1024});
    assert.equal(qr.bytes, 2000);
    assert.equal(decode(qr, paintQr).result.data, text);
  }
});

for (const [name, text] of [
  ['link with query and fragment', 'https://example.cz/cesta?q=hello&x=1#detail'],
  ['Czech text, emoji and exact whitespace', '  Příliš žluťoučký kůň 🐴\nDruhý řádek\t✓  '],
  ['markup as literal text', '<svg onload="alert(1)"> & "žluťoučký"'],
  ['numeric content with leading zeros', '000012345678901234567890'],
]) test(`QR round trip: ${name}`, async () => {
  const {createQr, paintQr} = await model();
  const qr = createQr(text, {kind: 'text'});
  const {result, data} = decode(qr, paintQr);
  assert.equal(result.data, text);
  assert.deepEqual(result.binaryData, Array.from(new TextEncoder().encode(text)));
  // Opaque, white outer border must never depend on page CSS.
  assert.deepEqual(Array.from(data.slice(0, 4)), [255,255,255,255]);
});

test('QR pixels decode at each export size and with a custom dark color', async () => {
  const {createQr, paintQr} = await model();
  for (const size of [256, 512, 1024]) {
    const qr = createQr('https://www.o2.cz/', {size, color: '#002776'});
    assert.equal(qr.size, size);
    assert.equal(decode(qr, paintQr).result.data, 'https://www.o2.cz/');
  }
});

test('QR validation rejects unreadable colors, unsupported settings and oversized input', async () => {
  const {createQr} = await model();
  for (const color of ['#ffffff', '#eeeeee', 'red', '#000" onload="x']) assert.throws(() => createQr('ok', {kind:'text', color}), /barv|kontrast/i);
  assert.throws(() => createQr('ok', {kind:'wifi'}), /typ/i);
  assert.throws(() => createQr('ok', {kind:'text', size:17}), /velikost/i);
  assert.throws(() => createQr('a'.repeat(2001), {kind:'text'}), /dlouh|2000/i);
  assert.throws(() => createQr('🐴'.repeat(501), {kind:'text'}), /dlouh|2000/i);
  assert.throws(() => createQr('a'.repeat(1800), {kind:'text', size:256}), /větší|velikost/i);
});

test('SVG contains an opaque quiet zone and only generated vector geometry', async () => {
  const {createQr, toSvg} = await model();
  const payload = '<script>alert("hello")</script>';
  const svg = toSvg(createQr(payload, {kind:'text', size:1024, color:'#002776'}));
  assert.match(svg, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(svg, /width="1024" height="1024"/);
  assert.match(svg, /fill="#ffffff"/);
  assert.match(svg, /fill="#002776"/);
  assert.ok(!svg.includes(payload));
  assert.doesNotMatch(svg, /<script|<image|href=|onload=/);
});
