import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { App } from './App';
import { PreferencesProvider } from './PreferencesProvider';
import { PageContextProvider } from './PageContextProvider';

it('production settings use an in-page select and preserve existing preference keys with nested Escape', async () => {
  localStorage.setItem('axolotl-2-theme','light');
  const user=userEvent.setup();
  Object.defineProperty(Element.prototype,'scrollIntoView',{configurable:true,value:()=>{}});
  try {
    render(<PreferencesProvider><PageContextProvider><App/></PageContextProvider></PreferencesProvider>);
    expect(document.documentElement).toHaveAttribute('data-theme','light');
    await user.click(screen.getByRole('button',{name:'Nastavení'}));
    await user.click(screen.getByRole('button',{name:'Vzhled a prostředí'}));
    const trigger=screen.getByRole('combobox',{name:'Barevný režim'});
    trigger.focus();await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox',{name:'Barevný režim'})).toBeVisible();
    await user.click(screen.getByRole('option',{name:'Tmavý'}));
    expect(localStorage.getItem('axolotl-2-theme')).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme','dark');
    trigger.focus();await user.keyboard('{Enter}{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(screen.getByRole('dialog',{name:'Nastavení'})).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog',{name:'Nastavení'})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Nastavení'})).toHaveFocus();
  } finally {Reflect.deleteProperty(Element.prototype,'scrollIntoView');}
});
