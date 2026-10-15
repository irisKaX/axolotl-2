import { mountReactTool } from '../../shared/react-ui/mount-tool.jsx';
import { ScreenshotController } from './controller.js';
import { createScreenshotView } from './view.jsx';
export function mount(root, app, options) {
  const controller = new ScreenshotController(app, options);
  const lifecycle = mountReactTool(root, app, createScreenshotView(controller));
  return { ...lifecycle,
    captureCurrent: mode => mode === 'element' ? controller.selectElement() : controller.capture(mode),
    cancelCurrent: () => controller.cancel(),
    onEvent: event => controller.onEvent(event),
    onTargetChange(target) { controller.onTargetChange(); lifecycle.onTargetChange(target); },
    destroy() { controller.destroy(); lifecycle.destroy(); }
  };
}
