import {it,expect} from 'vitest';
import {assertToolModule} from './registry';
it('rejects invalid lazy module contracts before mounting',()=>{
 for(const value of [null,{}, {mount:1}])expect(()=>assertToolModule(value)).toThrow(/mount/);
 expect(()=>assertToolModule({mount(){return {destroy(){}};}})).not.toThrow();
});
