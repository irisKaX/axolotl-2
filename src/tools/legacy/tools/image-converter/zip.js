import JSZip from 'jszip';

export async function buildZip(items, onProgress = () => {}) {
  const ready = items.filter(row => row.status === 'done' && row.result?.blob);
  if (!ready.length) throw new Error('Nejdříve převeďte alespoň jeden obrázek.');
  const zip = new JSZip();
  for (const row of ready) {
    if (!row.outputName || /[\\/]/.test(row.outputName))
      throw new Error('Neplatný název výstupního souboru.');
    zip.file(row.outputName, await row.result.blob.arrayBuffer(), { binary: true });
  }
  const data = await zip.generateAsync(
    { type: 'uint8array', compression: 'STORE', streamFiles: true },
    progress => onProgress(Math.round(progress.percent))
  );
  return new Blob([data], { type: 'application/zip' });
}
