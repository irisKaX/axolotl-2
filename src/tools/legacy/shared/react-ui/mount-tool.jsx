import { createRoot } from 'react-dom/client';
import { useSyncExternalStore } from 'react';

// A route hides this root instead of remounting it. React owns every descendant.
export function mountReactTool(root, app, Component) {
  root.dataset.runtimeControl = 'native';
  root.dataset.reactTool = 'true';
  root.classList.add('ax-ui');
  let state = { active: false, target: app.target() }, destroyed = false;
  const listeners = new Set();
  const store = {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
  function update(next) {
    if (destroyed) return;
    state = { ...state, ...next };
    for (const listener of listeners) listener();
  }
  function Tool() {
    const lifecycle = useSyncExternalStore(store.subscribe, store.getSnapshot);
    return <Component app={app} {...lifecycle} />;
  }
  const reactRoot = createRoot(root);
  reactRoot.render(<Tool />);
  return {
    onShow() { update({ active: true, target: app.target() }); },
    onHide() { update({ active: false }); },
    onTargetChange(target = app.target()) { update({ target }); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      reactRoot.unmount();
      listeners.clear();
    }
  };
}
