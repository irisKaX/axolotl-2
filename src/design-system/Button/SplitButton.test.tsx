import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as Buttons from './index';

describe('Split Button', () => {
  it('exports the composed control', () => {
    expect(Buttons).toHaveProperty('SplitButton');
  });
  it('separates the primary action from keyboard menu selection and restores focus', async () => {
    const user = userEvent.setup(), action = vi.fn(), select = vi.fn();
    render(<Buttons.SplitButton menuLabel="Formát exportu" onClick={action}
      items={['CSV', 'XLSX', 'PNG'].map(label => ({id: label, label, onSelect: () => select(label)}))}>Exportovat</Buttons.SplitButton>);
    await user.click(screen.getByRole('button', {name:'Exportovat'}));
    expect(action).toHaveBeenCalledOnce();
    const trigger = screen.getByRole('button', {name:'Formát exportu'});
    trigger.focus(); await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('menuitem', {name:'CSV'})).toHaveFocus());
    await user.keyboard('{End}{Enter}');
    expect(select).toHaveBeenCalledWith('PNG');
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.keyboard(' ');
    await user.keyboard('x');
    await waitFor(() => expect(screen.getByRole('menuitem', {name:'XLSX'})).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(action).toHaveBeenCalledOnce();
  });
  it('closes on outside interaction and blocks both halves while loading or disabled', async () => {
    const user = userEvent.setup(), action = vi.fn();
    const props = {menuLabel:'Formát exportu', items:[{id:'csv',label:'CSV',onSelect:action}], onClick:action};
    const {rerender} = render(<><Buttons.SplitButton {...props}>Exportovat</Buttons.SplitButton><button>Venku</button></>);
    await user.click(screen.getByRole('button', {name:'Formát exportu'}));
    await user.click(screen.getByRole('button', {name:'Venku'}));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    rerender(<Buttons.SplitButton {...props} loading>Exportovat</Buttons.SplitButton>);
    for(const button of screen.getAllByRole('button')) { expect(button).toHaveAttribute('aria-disabled','true'); fireEvent.click(button); }
    expect(action).not.toHaveBeenCalled(); expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    rerender(<Buttons.SplitButton {...props} disabled>Exportovat</Buttons.SplitButton>);
    for(const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
  });
});
