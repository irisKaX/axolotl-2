import {expect,test} from '@playwright/test';
import jsQR from 'jsqr';

const routes=[['media/konvertor-obrazku','convert'],['media/obrazky-z-webu','images'],['media/pdf-scout','pdf'],['media/screenshot','screenshot'],['media/qr','qr'],['kontrola/metadata','metadata'],['kontrola/nadpisy','headings'],['kontrola/strukturovana-data','structured'],['kontrola/obrazky','image-audit'],['kontrola/hledani-na-webu','search']];
for(const theme of ['dark','light']) test(`${theme}: all ten tools load without errors and retain their mounted workspace`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(theme=>localStorage.setItem('axolotl-2-theme',theme),theme);
  await page.goto('#dashboard');
  for(const [route,id] of routes) {
    await page.evaluate(route=>location.hash=route,route);
    const root=page.locator(`[data-tool="${id}"]`);await expect(root).toBeVisible();
    await expect(root.getByRole('heading').first()).toBeVisible();
    await expect(root).not.toContainText('Nástroj se nepodařilo načíst');
    await expect(page.locator('[data-tool]:visible')).toHaveCount(1);
    await root.evaluate(el=>el.setAttribute('data-regression-mounted','yes'));
  }
  await page.evaluate(()=>location.hash='media/qr');
  await expect(page.locator('[data-tool=qr]')).toHaveAttribute('data-regression-mounted','yes');
  for(const route of ['osobni-prostor/poznamky','dashboard']) {
    await page.evaluate(route=>location.hash=route,route);
    await expect(page.locator('[data-tool]:visible')).toHaveCount(0);
    await expect(page.getByRole('main')).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test('the committed header URL feeds QR generation, decodes correctly and survives navigation and reload',async({page})=>{
  await page.goto('#media/qr');
  const input=page.getByRole('textbox',{name:'Aktuální URL'});
  await input.fill('example.cz/integrace?x=1');await input.press('Enter');
  await page.getByRole('button',{name:'Aktuální stránka',exact:true}).click();
  await expect(page.locator('#qr-content')).toHaveValue('https://example.cz/integrace?x=1');
  await expect(page.getByRole('button',{name:'Stáhnout QR kód jako PNG'})).toBeEnabled();
  const pixels=await page.locator('#qr-preview').evaluate(el=>{
    const canvas=el as HTMLCanvasElement;
    return {width:canvas.width,height:canvas.height,rgba:Array.from(canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data)};
  });
  expect(jsQR(new Uint8ClampedArray(pixels.rgba),pixels.width,pixels.height)?.data).toBe('https://example.cz/integrace?x=1');
  await page.evaluate(()=>location.hash='dashboard');await page.evaluate(()=>location.hash='media/qr');
  await expect(page.locator('#qr-content')).toHaveValue('https://example.cz/integrace?x=1');
  await page.reload();await expect(input).toHaveValue('https://example.cz/integrace?x=1');
  await expect(page.getByRole('button',{name:'Aktuální stránka',exact:true})).toBeEnabled();
});

test('header tab selection and manual URL drive the real audit runtime through the extension protocol',async({page})=>{
  await page.addInitScript(()=>{
    const tabs=[{id:101,title:'První stránka',url:'https://first.example/',documentToken:'doc1'},{id:202,title:'Druhá stránka',url:'https://second.example/',documentToken:'doc2'}];
    const requests:{operation:string;target:{tabId:number;url:string}}[]=[];
    Object.assign(window,{integrationRequests:requests});
    window.addEventListener('message',event=>{
      const m=event.data;if(m?.source!=='axolotl-page')return;
      if(m.type==='AXOLOTL_GET_TABS') window.postMessage({source:'axolotl-extension',type:'AXOLOTL_TABS',requestId:m.requestId,ok:true,tabs,activeId:101},location.origin);
      if(m.type==='AXOLOTL_TOOL_REQUEST') {
        requests.push(m);
        const data=m.operation==='METADATA_SCAN'?{url:m.target.url,titles:[`Audit stránky ${m.target.tabId}`],descriptions:['Popis z ověřené cílové karty.'],truncated:false}:{};
        window.postMessage({source:'axolotl-extension',type:'AXOLOTL_TOOL_RESPONSE',requestId:m.requestId,ok:true,data},location.origin);
      }
    });
  });
  await page.goto('#kontrola/metadata');
  const input=page.getByRole('textbox',{name:'Aktuální URL'});await expect(input).toHaveValue('https://first.example/');
  const scan=page.getByRole('button',{name:/Zkontrolovat|Spustit kontrolu|Znovu zkontrolovat/});
  await scan.click();await expect(page.locator('.metadata-values')).toContainText(['Audit stránky 101','Popis z ověřené cílové karty.']);
  await page.getByRole('button',{name:'Vybrat kartu prohlížeče'}).click();await page.getByRole('button',{name:/Druhá stránka/}).click();
  await expect(page.locator('.metadata-values')).toHaveCount(0);await scan.click();await expect(page.locator('.metadata-values')).toContainText(['Audit stránky 202','Popis z ověřené cílové karty.']);
  await input.fill('https://first.example/');await input.press('Enter');await scan.click();
  await expect(page.locator('.metadata-values')).toContainText(['Audit stránky 101','Popis z ověřené cílové karty.']);
  expect(await page.evaluate(()=>(window as unknown as {integrationRequests:{operation:string;target:{tabId:number;url:string}}[]}).integrationRequests.filter(r=>r.operation==='METADATA_SCAN').map(r=>r.target.tabId))).toEqual([101,202,101]);
  await input.fill('https://unmatched.example/');await input.press('Enter');
  await expect(page.locator('.metadata-values')).toHaveCount(0);await scan.click();
  await expect(page.locator('#metadata-status')).toContainText(/vyberte otevřenou kartu|připojte/);
});
