import type { ToolModule } from './runtime';
const loaders = {
  convert: () => import('./legacy/tools/image-converter/index.js'),
  images: () => import('./legacy/tools/image-download/index.js'),
  pdf: () => import('./legacy/tools/pdf-scout/index.js'),
  screenshot: () => import('./legacy/tools/screenshot/index.js'),
  qr: () => import('./legacy/tools/qr-generator/index.js'),
  metadata: () => import('./legacy/tools/metadata-audit/index.js'),
  headings: () => import('./legacy/tools/headings-audit/index.js'),
  structured: () => import('./legacy/tools/structured-data/index.js'),
  'image-audit': () => import('./legacy/tools/image-audit/index.js'),
  search: () => import('./legacy/tools/web-search/index.js'),
};
export type ToolId = keyof typeof loaders;
export const toolRoutes: Record<string,ToolId> = {
  'media/konvertor-obrazku':'convert','media/obrazky-z-webu':'images',
  'media/pdf-scout':'pdf','media/screenshot':'screenshot','media/qr':'qr',
  'kontrola/metadata':'metadata','kontrola/nadpisy':'headings',
  'kontrola/strukturovana-data':'structured','kontrola/obrazky':'image-audit',
  'kontrola/hledani-na-webu':'search',
};
export const localTools = new Set<ToolId>(['qr','convert']);
export function loadTool(id:ToolId) {return loaders[id]() as unknown as Promise<ToolModule>;}
