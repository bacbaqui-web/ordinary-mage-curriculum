import {RUNES,valid} from './combo-design.mjs?v=ice-charge-2';
// Ordered operations retain a payload tree: delivery happens before the inner effect.
export function compileSpell(sequence,power=1){
 if(!valid(sequence))throw Error('잘못된 주문');const kind=sequence[0];let node={op:'base',kind,power,depth:1};const ops=sequence.length===1?sequence:sequence.slice(1);for(const op of ops)node={op,inner:node,kind,power,depth:sequence.length};return node;
}
export function spellReach(sequence){return 3+sequence.length*1.5+(sequence.includes('w')?3:0);}
export function spellPayload(kind,power){return {damage:({q:5,i:6,l:10,d:11,p:3,a:4,e:3,t:4,w:5,g:5,s:9,h:12}[kind]||5)*power,burn:kind==='q'?2:0,burnDamage:2*power,slow:kind==='i'?2.2:kind==='a'?1:0,poison:kind==='p'?3:0,wet:kind==='a'?3:0,force:kind==='w'?1.6:kind==='g'?-1.4:0};}
