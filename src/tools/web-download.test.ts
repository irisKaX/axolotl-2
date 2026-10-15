import {describe,it,expect,vi} from 'vitest';
import {saveDownload} from './legacy/shared/download-file.js';
describe('web-native file exports',()=>{
  it('offers the real blob as a download without claiming the file is saved',async()=>{
    vi.useFakeTimers();
    const create=vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:https://iriskax.github.io/test');
    const revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
    let offered:HTMLAnchorElement|undefined;
    vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(function(this:HTMLAnchorElement){offered=this;});
    const blob=new Blob(['actual svg bytes'],{type:'image/svg+xml'});
    const result=await saveDownload(blob,'O2-Axolotl/qr.svg');
    expect(create).toHaveBeenCalledWith(blob);
    expect(offered?.download).toBe('qr.svg');
    expect(offered?.href).toBe('blob:https://iriskax.github.io/test');
    expect(result.state).toBe('started');
    expect(document.querySelector('a[download]')).toBeNull();
    vi.runAllTimers();expect(revoke).toHaveBeenCalledWith('blob:https://iriskax.github.io/test');
  });
  it('does not offer a canceled export',async()=>{
    const controller=new AbortController();controller.abort();
    await expect(saveDownload(new Blob(['x']),'x.svg',{signal:controller.signal})).rejects.toMatchObject({name:'AbortError'});
  });
});
