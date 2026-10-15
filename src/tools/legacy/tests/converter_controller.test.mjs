import test from 'node:test';
import assert from 'node:assert/strict';
import { ConverterController } from '../tools/image-converter/controller.js';

const file = name => new File(['input'], name, { type: 'image/png' });
const result = { blob: new Blob(['webp']), thumbnail: new Blob(['thumb']), width: 2, height: 2 };
const deferred = () => { let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej; }); return { promise, resolve, reject }; };
const app = { toast() {} };

test('batch retains successful output after partial failure and publishes stable snapshots', async () => {
  const saved = [];
  const controller = new ConverterController(app, { client: { async convert(f) { if(f.name==='broken.png') throw new Error('Invalid data'); return result; }, close() {} }, save: async (blob,name) => saved.push({blob,name}) });
  let changes = 0; const unsubscribe = controller.subscribe(() => changes++);
  const initial = controller.getSnapshot();
  assert.equal(controller.getSnapshot(), initial);
  assert.equal(controller.addFiles([file('a.png'),file('broken.png')]).accepted,2);
  await controller.start({lossless:false,quality:85});
  const final = controller.getSnapshot();
  assert.deepEqual(final.items.map(r=>r.status),['done','error']);
  assert.equal(initial.items.length,0);
  assert.equal(final.items[0].options.quality,85);
  const renamed = controller.rename(final.items[0].id,'Žlutý obrázek');
  await controller.saveOne(final.items[0].id);
  assert.equal(saved[0].name,renamed);
  assert.equal(saved[0].blob,result.blob);
  unsubscribe();const before=changes;controller.clear();assert.equal(changes,before);
  controller.destroy();
});

test('stop rejects late worker results; destroying suppresses notifications and future changes', async () => {
  let phase; const conversion=deferred();
  const controller=new ConverterController(app,{client:{convert(f,o,ctx){phase=ctx.onPhase;return conversion.promise;},close(){}}});
  controller.addFiles([file('a.png')]);const run=controller.start({lossless:true});await Promise.resolve();
  const stopped=controller.stop();conversion.resolve(result);await stopped;await run;
  assert.equal(controller.getSnapshot().items[0].status,'pending');
  assert.equal(controller.getSnapshot().items[0].result,null);
  let changes=0;controller.subscribe(()=>changes++);controller.destroy();phase('Late phase');
  assert.equal(controller.addFiles([file('b.png')]).accepted,0);
  assert.equal(changes,0);
});

test('ZIP lock blocks edits and duplicate exports; destroy prevents a late ZIP download', async () => {
  const archive=deferred();let saves=0,builds=0;
  const controller=new ConverterController(app,{client:{async convert(){return result;},close(){}},zip:async()=>{builds++;return archive.promise;},save:async()=>saves++});
  controller.addFiles([file('a.png')]);await controller.start({lossless:true});
  const exportTask=controller.saveAll();controller.saveAll();controller.clear();
  assert.equal(controller.getSnapshot().items.length,1);
  assert.equal(controller.addFiles([file('b.png')]).accepted,0);
  assert.equal(builds,1);
  controller.destroy();archive.resolve(new Blob(['zip']));await exportTask;
  assert.equal(saves,0);
});

test('saving has a synchronous per-file lock and prevents result removal until completed', async () => {
  const download=deferred();let saves=0;
  const controller=new ConverterController(app,{client:{async convert(){return result;},close(){}},save:async()=>{saves++;await download.promise;}});
  controller.addFiles([file('a.png')]);await controller.start({lossless:true});
  const id=controller.getSnapshot().items[0].id;
  const pending=controller.saveOne(id);controller.saveOne(id);controller.remove(id);controller.clear();
  assert.equal(saves,1);assert.equal(controller.getSnapshot().items.length,1);
  download.resolve();await pending;controller.remove(id);
  assert.equal(controller.getSnapshot().items.length,0);controller.destroy();
});


test('activity follows conversion and stays downloading until the saved file completes', async () => {
  const conversion = deferred(), download = deferred(), toasts = [];
  const controller = new ConverterController({ toast: message => toasts.push(message) }, {
    client: { convert: () => conversion.promise, close() {} }, save: () => download.promise
  });
  assert.equal(controller.getSnapshot().activity.phase, 'idle');
  controller.addFiles([file('a.png')]);
  assert.equal(controller.getSnapshot().activity.phase, 'ready');
  const converting = controller.start({ lossless: true });
  assert.equal(controller.getSnapshot().activity.phase, 'working');
  conversion.resolve(result); await converting;
  assert.equal(controller.getSnapshot().activity.label, 'Čeká na stažení');
  const id = controller.getSnapshot().items[0].id;
  const saving = controller.saveOne(id);
  assert.equal(controller.getSnapshot().activity.phase, 'download');
  assert.equal(controller.getSnapshot().busy, true);
  assert.deepEqual(toasts, []);
  download.resolve({ id: 42, state: 'complete' }); await saving;
  assert.equal(controller.getSnapshot().activity.label, 'Čeká na obrázky');
  assert.equal(controller.getSnapshot().busy, false);
  assert.equal(controller.getSnapshot().items[0].result.blob, result.blob);
  assert.deepEqual(toasts, ['WebP bylo předáno prohlížeči ke stažení.']);
  controller.addFiles([file('b.png')]);
  assert.equal(controller.getSnapshot().activity.phase, 'ready');
  controller.destroy();
});

test('canceled and interrupted downloads keep results ready and never announce completion', async () => {
  const toasts = [];
  let download = deferred();
  const controller = new ConverterController({ toast: message => toasts.push(message) }, {
    client: { async convert() { return result; }, close() {} }, save: () => download.promise
  });
  controller.addFiles([file('a.png')]); await controller.start({ lossless: true });
  const id = controller.getSnapshot().items[0].id;
  const canceled = controller.saveOne(id);
  download.reject(Object.assign(new Error('Canceled'), { name: 'AbortError', code: 'USER_CANCELED' }));
  await canceled;
  assert.equal(controller.getSnapshot().activity.label, 'Čeká na stažení');
  assert.equal(controller.getSnapshot().busy, false);
  download = deferred();
  const interrupted = controller.saveOne(id);
  download.reject(new Error('Disk full'));
  await assert.rejects(interrupted, /Disk full/);
  assert.equal(controller.getSnapshot().activity.label, 'Čeká na stažení');
  assert.equal(controller.getSnapshot().items[0].result.blob, result.blob);
  assert.deepEqual(toasts, []);
  controller.destroy();
});

test('ZIP preparation and actual download have separate activity phases', async () => {
  const archive = deferred(), download = deferred();
  const controller = new ConverterController(app, {
    client: { async convert() { return result; }, close() {} }, zip: () => archive.promise, save: () => download.promise
  });
  controller.addFiles([file('a.png')]); await controller.start({ lossless: true });
  const saving = controller.saveAll();
  assert.equal(controller.getSnapshot().activity.phase, 'working');
  assert.equal(controller.getSnapshot().activity.label, 'Připravuji ZIP');
  archive.resolve(new Blob(['zip'])); await Promise.resolve();
  assert.equal(controller.getSnapshot().activity.phase, 'download');
  assert.equal(controller.getSnapshot().busy, true);
  download.resolve({ id: 43, state: 'complete' }); await saving;
  assert.equal(controller.getSnapshot().activity.phase, 'idle');
  assert.equal(controller.getSnapshot().items[0].result.blob, result.blob);
  controller.destroy();
});
