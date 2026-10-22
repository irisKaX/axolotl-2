import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnimatedAxolotlLogo } from './AnimatedAxolotlLogo';

describe('Animated Axolotl Logo semantics', () => {
  it('uses one flat SVG head with six mirrored gills, two plain eyes and one smile', () => {
    const {container}=render(<AnimatedAxolotlLogo />);
    const mark=container.querySelector('svg.axo-animated-mark__symbol');
    expect(mark).not.toBeNull();
    expect(mark?.querySelectorAll('[data-gill]')).toHaveLength(6);
    const sides=mark!.querySelectorAll('[data-gills]');
    expect(sides).toHaveLength(2);
    expect(sides[1]).toHaveAttribute('transform','translate(60 0) scale(-1 1)');
    expect([...sides[0].querySelectorAll('path')].map(p=>p.getAttribute('d'))).toEqual([...sides[1].querySelectorAll('path')].map(p=>p.getAttribute('d')));
    expect(mark?.querySelectorAll('[data-eye]')).toHaveLength(2);
    expect(mark?.querySelectorAll('[data-smile]')).toHaveLength(1);
    expect(mark?.querySelectorAll('filter, image, linearGradient, radialGradient, animate')).toHaveLength(0);
    expect(container.firstElementChild?.getAttribute('style')??'').not.toContain('--mascot');
  });
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
