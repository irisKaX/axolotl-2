import {act, fireEvent, render, screen} from '@testing-library/react';
import {beforeEach,describe, it, expect,vi} from 'vitest';
import {App} from '../app/App';
import {PageContextProvider} from '../app/PageContextProvider';
import {PreferencesProvider} from '../app/PreferencesProvider';

function mount() {
  return render(<PreferencesProvider><PageContextProvider><App/></PageContextProvider></PreferencesProvider>);
}
async function navigate(route: string) {
  await act(async () => { location.hash = '#'+route; window.dispatchEvent(new HashChangeEvent('hashchange')); });
}
describe('working tool routes', () => {
  beforeEach(()=>{
    vi.stubGlobal('ResizeObserver',class {observe(){} unobserve(){} disconnect(){}});
  });
  it('opens all ten real tools through their existing routes', async () => {
    mount();
    for (const [route,title] of [
      ['media/qr','QR generátor'], ['media/konvertor-obrazku','Konverze obrázků'],
      ['media/obrazky-z-webu','Obrázky z webu'], ['media/pdf-scout','PDF Scout'],
      ['media/screenshot','Screenshot Tool'], ['kontrola/metadata','Metadata'],
      ['kontrola/nadpisy','Nadpisy'], ['kontrola/strukturovana-data','Strukturovaná data'],
      ['kontrola/obrazky','Kontrola obrázků'], ['kontrola/hledani-na-webu','Hledání na webu'],
    ]) {
      await navigate(route);
      expect(await screen.findByRole('heading',{level:1,name:title})).toBeVisible();
      expect(screen.getAllByRole('heading',{level:1})).toHaveLength(1);
    }
    await navigate('dashboard');
    expect(document.getElementById('axolotl-office-slot')).toBeEmptyDOMElement();
    expect(screen.queryByRole('heading',{level:1})).not.toBeInTheDocument();
  });
  it('keeps a QR draft when returning from another tool', async () => {
    location.hash='#media/qr'; mount();
    const input=await screen.findByLabelText('Odkaz k zakódování');
    fireEvent.change(input,{target:{value:'unfinished draft'}});
    await navigate('kontrola/metadata');
    await screen.findByRole('heading',{level:1,name:'Metadata'});
    await navigate('media/qr');
    expect(await screen.findByLabelText('Odkaz k zakódování')).toHaveValue('unfinished draft');
  });
  it('explains missing browser access instead of showing made-up audit results', async () => {
    location.hash='#kontrola/metadata'; mount();
    fireEvent.click(await screen.findByRole('button',{name:'Zkontrolovat stránku'}));
    expect(await screen.findByText(/Pro kontrolu vyberte otevřenou kartu/)).toBeVisible();
  });
});
