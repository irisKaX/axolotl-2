import { mountReactTool } from '../../shared/react-ui/mount-tool.jsx';
import { QrView } from './view.jsx';

export function mount(root, app) {
  root.classList.add('qr-tool');
  return mountReactTool(root, app, QrView);
}
