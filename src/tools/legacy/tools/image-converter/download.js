import { saveDownload } from '../../shared/download-file.js';

/** Preserve the converter destination while awaiting confirmed browser completion. */
export function saveBlob(blob, filename, options) {
  return saveDownload(blob, 'O2-Axolotl/WebP/' + filename, options);
}
