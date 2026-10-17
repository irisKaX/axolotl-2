/** Audit the actual reference and studies, including interactive paint, not just CSS source. */
import { pathToFileURL } from 'node:url';
export const protectedTokens = ['--pn-row-hover','--pn-strong','--pn-text','--pn-pill','--pn-pill-ink','--pn-ring','--pn-tile','--pn-tile-rim','--pn-edge'];
export async function capturePillNav(page, width) {
  const read = async (selector, pseudo) => page.locator(selector).first().evaluate((el, pseudo) => {
    const s = getComputedStyle(el, pseudo);
    return Object.fromEntries(['backgroundColor','backgroundImage','color','boxShadow','borderRadius','fontSize','fontWeight','outlineColor','outlineWidth','outlineOffset','content'].map(k => [k,s[k]]));
  }, pseudo);
  const tokenRead = selector => page.locator(selector).evaluate((el, names) => Object.fromEntries(names.map(n => [n,getComputedStyle(el).getPropertyValue(n).trim()])), protectedTokens);
  const states = { tokens: await tokenRead('.hr-scene') };
  if (width > 1180) {
    states.navTokens = await tokenRead('.axolotl-pill-nav');
    const group = page.getByRole('button',{name:'Média',exact:true});
    states.idle = await read('.axolotl-pill-trigger');
    await group.hover();
    states.topHover = await read('.axolotl-pill-trigger .axolotl-pill-nav__fill');
    await group.click();
    const link = page.getByRole('link',{name:'QR',exact:true});
    await link.hover();
    states.rowHover = await read('.axolotl-nav-link[href="#media/qr"]');
    await link.click();
    await group.click();
    await page.mouse.move(width-1,800);
    states.rowActive = await read('.axolotl-nav-link[aria-current=page]');
    states.topActive = await read('.axolotl-pill-nav__slot[data-on] .axolotl-pill-nav__fill');
    const decoration = await read('.axolotl-pill-nav__slot[data-on]','::after');
    // Unpainted pseudo-elements have inherited colors but no visual output.
    states.activeDecoration = decoration.content === 'none' ? { content: 'none' } : decoration;
    await page.keyboard.press('Escape');
    await group.focus();
    states.focus = await read('.axolotl-pill-trigger');
  } else {
    states.menuIdle = await read('.hr-trigger');
    await page.locator('.hr-trigger').click();
    await page.getByRole('button',{name:'Média',exact:true}).hover();
    states.groupHover = await read('.hr-group-toggle:hover');
    await page.getByRole('button',{name:'Média',exact:true}).click();
    await page.mouse.move(width-1,800);
    states.groupExpanded = await read('.hr-group-toggle[aria-expanded=true]');
    const link = page.getByRole('link',{name:'QR',exact:true});
    await link.hover();
    states.rowHover = await read('.hr-panel a[href="#media/qr"]');
    await link.click();
    await page.locator('.hr-trigger').click();
    await page.mouse.move(width-1,800);
    states.rowActive = await read('.hr-panel [aria-current=page]');
    states.groupNumber = await read('.hr-group-number');
    await page.keyboard.press('Tab');
    await page.getByRole('link',{name:'QR',exact:true}).focus();
    states.focus = await read('.hr-panel [aria-current=page]');
  }
  return states;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { createServer } = await import('vite');
  const { chromium } = await import('playwright');
  const { mkdir, writeFile } = await import('node:fs/promises');
  const output = process.argv[2] || '/tmp/axolotl-hover-regression';
  await mkdir(output,{recursive:true});
  const server = await createServer({server:{host:'127.0.0.1',port:4177,strictPort:true}}); await server.listen();
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROME_EXECUTABLE || undefined});
  const records=[];
  try {
    for (const theme of ['dark','light']) for (const width of [1440,1024,390]) for (const variant of ['C2','A','B','C']) {
      const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
      const entry=variant==='C2'?'header-responsive-lab':'header-visual-lab';
      await page.goto(`http://127.0.0.1:4177/axolotl-2/${entry}.html?view=scene&variant=${variant}&theme=${theme}`);
      await page.locator('.hr-bar').waitFor();
      const states=await capturePillNav(page,width);
      records.push({variant,theme,width,states});
      await page.screenshot({path:`${output}/${variant}-${theme}-${width}.png`});
      await page.close();
    }
    await writeFile(`${output}/computed.json`,JSON.stringify({method:'Real Chromium computed styles, C2 reference + A/B/C; hover, active, expanded, focus; reduced motion.',records},null,2));
    console.log(`Audited ${records.length} interactive scenes: ${output}/computed.json`);
  } finally { await browser.close(); await server.close(); }
}
