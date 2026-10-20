import { describe, expect, it } from 'vitest';
import { initialLayout, reduceLayout, layoutFor, available, columns } from './model';
describe('free dashboard grid', () => {
  it('protects Office and rejects collisions without moving other widgets', () => {
    const state = initialLayout();
    expect(reduceLayout(state, { type: 'remove', id: 'office' })).toBe(state);
    expect(reduceLayout(state, { type: 'adjust', view: 'desktop', id: 'office', patch: { y: 0 } })).toBe(state);
    expect(reduceLayout(state, { type: 'adjust', view: 'desktop', id: 'search-1', patch: { x: 8, y: 4 } })).toBe(state);
  });
  it('keeps manual positions through add/remove and separate responsive layouts', () => {
    let state = reduceLayout(initialLayout(), { type: 'adjust', view: 'desktop', id: 'search-1', patch: { y: 35, w: 24 } });
    const desktop = layoutFor(state, 'desktop');
    state = reduceLayout(state, { type: 'adjust', view: 'mobile', id: 'qr-2', patch: { y: 45 } });
    expect(layoutFor(state, 'desktop')).toEqual(desktop);
    state = reduceLayout(state, { type: 'add', kind: 'generic', size: 'small' });
    expect(layoutFor(state, 'desktop').find(x => x.i === 'search-1')).toMatchObject({ y: 35, w: 24 });
    for (const view of ['desktop', 'tablet', 'mobile'] as const) {
      const layout = layoutFor(state, view);
      expect(layout.every(item => available(layout, item, columns[view]))).toBe(true);
    }
    state = reduceLayout(state, { type: 'remove', id: 'generic-3' });
    expect(layoutFor(state, 'desktop')).toEqual(desktop);
  });
  it('restores either existing composition without retaining added widgets', () => {
    let state = reduceLayout(initialLayout(), { type: 'composition', value: 'staggered' });
    state = reduceLayout(state, { type: 'add', kind: 'generic' });
    state = reduceLayout(state, { type: 'reset' });
    expect(state.composition).toBe('staggered');
    expect(state.items).toHaveLength(2);
    expect(layoutFor(state, 'desktop').find(x => x.i === 'office')).toMatchObject({ x: 8, y: 6, static: true });
  });
});
