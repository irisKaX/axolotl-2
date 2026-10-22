import {describe,it,expect} from 'vitest';
import {evaluateRobots} from './robots';
const meta=(content:string,name='robots')=>({name,content});
describe('Googlebot web robots directives (synthetic fixtures)',()=>{
 it('only allows after both sources have been inspected',()=>{
  expect(evaluateRobots({entries:[meta('index, follow')],headers:[]}).state).toBe('allowed');
  expect(evaluateRobots({entries:[],headers:[]}).state).toBe('allowed');
  expect(evaluateRobots({entries:[meta('index, follow')]}).state).toBe('unknown');
  expect(evaluateRobots({headers:[]}).state).toBe('unknown');
 });
 it.each(['noindex','nofollow','none','NOINDEX, NOFOLLOW'])('detects %s even with incomplete sources',content=>{
  expect(evaluateRobots({entries:[meta(content)]}).state).toBe('blocked');
 });
 it('combines generic and Googlebot restrictions; never applies another bot scope',()=>{
  expect(evaluateRobots({entries:[meta('noindex'),meta('index','googlebot')],headers:[]}).index).toBe('noindex');
  expect(evaluateRobots({entries:[meta('none','bingbot')],headers:['bingbot: noindex, nofollow, googlebot: index, follow']}).state).toBe('allowed');
  expect(evaluateRobots({entries:[],headers:['googlebot: nofollow','noindex'] })).toMatchObject({state:'blocked',index:'noindex',follow:'nofollow'});
  expect(evaluateRobots({entries:[meta('nofollow','googlebot-image')],headers:[]}).state).toBe('allowed');
 });
 it('does not confuse parameters or unavailable_after timestamps with bot scopes',()=>{
  expect(evaluateRobots({entries:[],headers:['max-snippet: -1, nofollow']}).follow).toBe('nofollow');
  expect(evaluateRobots({entries:[],headers:['unavailable_after: 01 Jan 2020 12:00:00 GMT']}).state).toBe('unknown');
 });
 it('never allows truncated or malformed observations',()=>{
  expect(evaluateRobots({entries:[],headers:[],truncated:true}).state).toBe('unknown');
  expect(evaluateRobots({entries:[{name:'robots',content:42}],headers:[]} as never).state).toBe('unknown');
 });
});
