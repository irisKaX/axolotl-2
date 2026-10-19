import { createRef, StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { system } from '../../test/setup';
import { Button } from './Button';

// Exercise our host/ref boundary without pretending jsdom implements a canvas.
vi.mock('./vendor/StarBorder', () => ({ default: ({ as: Host, color, duration }: any) =>
  <Host><canvas data-color={color} data-duration={duration} aria-hidden="true" /></Host> }));
const icon = <svg data-testid="icon" />;

describe('Lens Button contract', () => {
  it('is a native non-submitting button by default and forwards its ref', () => {
    const submit = vi.fn(); const ref = createRef<HTMLButtonElement>();
    render(<form onSubmit={submit}><Button ref={ref}>Akce</Button></form>);
    const button = screen.getByRole('button', { name: 'Akce' });
    expect(ref.current).toBe(button); expect(button).toHaveAttribute('type', 'button');
    fireEvent.click(button); expect(submit).not.toHaveBeenCalled();
  });
  it('preserves native submit semantics and form values', () => {
    const submit = vi.fn(e => e.preventDefault());
    render(<form onSubmit={submit}><Button type="submit" name="intent" value="save">Uložit</Button></form>);
    fireEvent.click(screen.getByRole('button'));
    expect(submit).toHaveBeenCalledOnce(); expect(submit.mock.calls[0][0].nativeEvent.submitter.value).toBe('save');
  });
  it('supports keyboard activation once per Enter/Space', async () => {
    const user = userEvent.setup(); const click = vi.fn();
    render(<Button onClick={click}>Akce</Button>);
    await user.tab(); expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter} '); expect(click).toHaveBeenCalledTimes(2);
  });
  it('uses a stable accessible name for icon-only loading buttons', () => {
    const { rerender } = render(<Button variant="icon" icon={icon} aria-label="Uložit" />);
    expect(screen.getByRole('button', { name: 'Uložit' })).not.toHaveAttribute('aria-busy');
    rerender(<Button variant="icon" icon={icon} aria-label="Uložit" loading />);
    expect(screen.getByRole('button', { name: 'Uložit' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });
  it('blocks loading activation and form submission while retaining focus and DOM identity', async () => {
    const click = vi.fn(), capture = vi.fn(), submit = vi.fn(e => e.preventDefault());
    const { rerender } = render(<form onSubmit={submit}><Button type="submit" onClick={click}>Odeslat</Button></form>);
    const button = screen.getByRole('button'); button.focus();
    rerender(<form onSubmit={submit}><Button type="submit" loading onClick={click} onClickCapture={capture}>Odeslat</Button></form>);
    expect(screen.getByRole('button')).toBe(button); expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(button); await userEvent.setup().keyboard('{Enter} ');
    expect(click).not.toHaveBeenCalled(); expect(capture).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
  });
  it('makes disabled native and keeps aria-disabled consumers inert', () => {
    const click = vi.fn(); const { rerender } = render(<Button disabled onClick={click}>Akce</Button>);
    expect(screen.getByRole('button')).toBeDisabled(); fireEvent.click(screen.getByRole('button'));
    rerender(<Button aria-disabled="true" onClick={click}>Akce</Button>); fireEvent.click(screen.getByRole('button'));
    expect(click).not.toHaveBeenCalled();
  });
  it('separates sizes, variants and motion; no default canvas', () => {
    render(<Button variant="destructive" size="large" icon={icon}>Smazat</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'destructive');
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'large');
    expect(document.querySelector('canvas')).toBeNull();
  });
  it('keeps the same native root and ref when motion changes; passes color and seconds', async () => {
    const ref = createRef<HTMLButtonElement>();
    const { rerender } = render(<StrictMode><Button ref={ref}>Akce</Button></StrictMode>);
    const root = ref.current; root!.focus();
    rerender(<StrictMode><Button ref={ref} motion="star-border" starBorder={{ color: '#123456', duration: 7 }}>Akce</Button></StrictMode>);
    await waitFor(() => expect(root!.querySelector('canvas')).not.toBeNull());
    expect(ref.current).toBe(root); expect(root).toHaveFocus(); expect(document.querySelectorAll('button')).toHaveLength(1);
    expect(root!.querySelector('canvas')).toHaveAttribute('data-color', '#123456');
    expect(root!.querySelector('canvas')).toHaveAttribute('data-duration', '7');
    rerender(<StrictMode><Button ref={ref} motion="star-border" loading>Akce</Button></StrictMode>);
    expect(root!.querySelector('canvas')).toBeNull(); expect(ref.current).toBe(root);
  });
  it('responds to live OS reduced motion and never overrides it with false', async () => {
    render(<Button motion="star-border" reducedMotion={false}>Akce</Button>);
    await waitFor(() => expect(document.querySelector('canvas')).not.toBeNull());
    act(() => system('(prefers-reduced-motion: reduce)', true));
    await waitFor(() => expect(document.querySelector('canvas')).toBeNull());
    act(() => system('(prefers-reduced-motion: reduce)', false));
    await waitFor(() => expect(document.querySelector('canvas')).not.toBeNull());
  });
  it('honors provider-compatible scoped motion changes and explicit reduced motion', async () => {
    const { rerender } = render(<div data-motion="full"><Button motion="star-border">Akce</Button></div>);
    await waitFor(() => expect(document.querySelector('canvas')).not.toBeNull());
    rerender(<div data-motion="reduced"><Button motion="star-border">Akce</Button></div>);
    await waitFor(() => expect(document.querySelector('canvas')).toBeNull());
    rerender(<div data-motion="full"><Button motion="star-border" reducedMotion>Akce</Button></div>);
    expect(document.querySelector('canvas')).toBeNull();
  });
});
