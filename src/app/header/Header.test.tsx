import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PreferencesProvider } from '../PreferencesProvider';
import { PageContextProvider } from '../PageContextProvider';
import { createPageStore } from '../../lib/browser-bridge';
import { system } from '../../test/setup';
import { AppHeader } from './AppHeader';

function mount(route = 'dashboard') {
  system('(max-width: 1180px)', true);
  const store = createPageStore();
  const navigate = vi.fn();
  const view = render(<PreferencesProvider><PageContextProvider store={store}><AppHeader route={route} onNavigate={navigate}/></PageContextProvider></PreferencesProvider>);
  return { ...view, store, navigate };
}
const menu = () => screen.getByRole('button', { name: 'Otevřít navigaci' });
const group = (name: string) => screen.getByRole('button', { name });

describe('isolated header contract', () => {
  it('opens dashboard with collapsed groups, permits one group and resets exploration', async () => {
    const user = userEvent.setup(); mount();
    await user.click(menu());
    for (const name of ['Můj workspace', 'Média', 'Kontrola']) expect(group(name)).toHaveAttribute('aria-expanded', 'false');
    await user.click(group('Média'));
    await user.click(group('Kontrola'));
    expect(group('Média')).toHaveAttribute('aria-expanded', 'false');
    expect(group('Kontrola')).toHaveAttribute('aria-expanded', 'true');
    await user.click(group('Kontrola'));
    expect(group('Kontrola')).toHaveAttribute('aria-expanded', 'false');
    await user.click(group('Média'));
    await user.keyboard('{Escape}');
    await user.click(menu());
    expect(group('Média')).toHaveAttribute('aria-expanded', 'false');
  });
  it('restores the current group and closes even when selecting the same route', async () => {
    const user = userEvent.setup(); const { navigate } = mount('kontrola/nadpisy');
    await user.click(menu());
    expect(group('Kontrola')).toHaveAttribute('aria-expanded', 'true');
    const link = screen.getByRole('link', { name: 'Nadpisy' });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(within(link).getByText('✓')).toBeInTheDocument();
    await user.click(link);
    expect(screen.queryByRole('dialog', { name: 'Navigace' })).not.toBeInTheDocument();
    expect(navigate).toHaveBeenCalledOnce();
    await user.click(menu());
    expect(group('Kontrola')).toHaveAttribute('aria-expanded', 'true');
  });
  it('has one root popup, closes on outside press and restores focus on Escape', async () => {
    const user = userEvent.setup(); mount();
    await user.click(menu());
    const settings = group('Nastavení');
    await user.click(settings);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Nastavení' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(settings).toHaveFocus();
    await user.click(settings);
    fireEvent.pointerDown(document.body, { pointerType: 'touch' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('keeps a touch-opened panel mounted after pointerleave', async () => {
    const user = userEvent.setup(); mount();
    const settings = group('Nastavení');
    await user.click(settings);
    fireEvent.pointerLeave(settings, { pointerType: 'touch' });
    expect(screen.getByRole('dialog', { name: 'Nastavení' })).toBeInTheDocument();
  });
  it('returns from appearance to its original row and persists preference changes', async () => {
    const user = userEvent.setup(); mount();
    await user.click(group('Nastavení'));
    await user.click(group('Vzhled a prostředí'));
    // JSDOM has no layout/scrollIntoView. Pointer geometry is covered in Playwright.
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable:true, value:()=>{} });
    try {
      screen.getByRole('combobox', { name:'Velikost textu' }).focus();
      await user.keyboard('{Enter}');
      await user.click(screen.getByRole('option', { name:'Větší (115 %)' }));
    } finally { Reflect.deleteProperty(Element.prototype,'scrollIntoView'); }
    expect(localStorage.getItem('axolotl-2-text-size')).toBe('large');
    await user.click(group('Zpět do nastavení'));
    expect(group('Vzhled a prostředí')).toHaveFocus();
  });
  it('does not overwrite a URL draft and Escape restores the latest committed context', async () => {
    const user = userEvent.setup(); const { store } = mount();
    act(() => store.commitManual('first.example'));
    const input = screen.getByRole('textbox', { name: 'Aktuální URL' });
    await user.clear(input); await user.type(input, 'draft.example');
    act(() => store.commitManual('second.example'));
    expect(input).toHaveValue('draft.example');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('https://second.example/');
    await user.clear(input); await user.type(input, 'javascript:alert(1){Enter}');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(store.getSnapshot().context.url).toBe('https://second.example/');
  });
});
