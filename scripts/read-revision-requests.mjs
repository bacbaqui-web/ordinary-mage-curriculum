// Run over SSH on the game host. This reads data; it never executes request text.
import {readFile} from 'node:fs/promises';
import {describe,RUNES} from '../dist/combo-design.mjs';
const file=process.env.MAGE_REQUESTS_FILE||'/var/lib/ordinary-mage/revision-requests.json';
const filter=process.argv[2];
try{
 const db=JSON.parse(await readFile(file,'utf8'));
 const items=db.items.filter(x=>x.text&&(!filter||x.owner.startsWith(filter))).sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt));
 console.log(JSON.stringify(items.map(x=>({notebook:x.owner.slice(0,12),sequence:x.sequence,name:describe(x.sequence).name,recipe:[...x.sequence].map(k=>RUNES[k].name).join(' → '),text:x.text,version:x.version,updatedAt:x.updatedAt,url:'https://radio.magamiscom.ing/mage/skill-plan.html#'+x.sequence})),null,2));
}catch(e){if(e.code==='ENOENT')console.log('[]');else throw e;}
