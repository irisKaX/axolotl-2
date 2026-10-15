import { mountReactTool } from '../../shared/react-ui/mount-tool.jsx';
import { ConverterController } from './controller.js';
import { createConverterView } from './view.jsx';

export function mount(root, app) {
  root.classList.add('converter');
  const controller = new ConverterController(app);
  const lifecycle = mountReactTool(root, app, createConverterView(controller));
  const beforeUnload = event => { if (controller.busy) { event.preventDefault(); event.returnValue = ''; } };
  window.addEventListener('beforeunload', beforeUnload);
  return {
    ...lifecycle,
    addFiles: files => controller.addFiles(files),
    destroy() {
      controller.destroy();
      lifecycle.destroy();
      window.removeEventListener('beforeunload', beforeUnload);
    }
  };
}
