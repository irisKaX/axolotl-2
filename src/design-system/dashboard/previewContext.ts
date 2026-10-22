import { createPageStore, type PageStore } from '../../lib/browser-bridge';
/** Use the existing extension bridge; absent extension is a real disconnected state. */
export function createDashboardPageStore(): PageStore {
  return createPageStore();
}
