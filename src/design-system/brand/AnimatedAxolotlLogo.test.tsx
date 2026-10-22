import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnimatedAxolotlLogo } from './AnimatedAxolotlLogo';

describe('Animated Axolotl Logo semantics', () => {
  it('names the mark without adding a fake interactive control', () => {
    render(<AnimatedAxolotlLogo label="Axolotl Workspace" />);
    expect(screen.getByRole('img', {name:'Axolotl Workspace'})).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('announces meaningful loader text even with motion paused', () => {
    render(<AnimatedAxolotlLogo variant="loader" label="Načítám pracovní prostor" paused />);
    expect(screen.getByRole('status')).toHaveTextContent('Načítám pracovní prostor');
    expect(screen.getByRole('status')).toHaveAttribute('data-paused','true');
  });
  it('can be decorative next to an existing label without a duplicate announcement', () => {
    const {container} = render(<AnimatedAxolotlLogo variant="loader" decorative />);
    expect(container.firstChild).toHaveAttribute('aria-hidden','true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
