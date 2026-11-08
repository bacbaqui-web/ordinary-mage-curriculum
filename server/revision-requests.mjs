import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const validSeq=s=>typeof s==='string'&&/^[qildpetwgsh]{1,3}$/.test(s);
const failure=(status,message,extra={})=>Object.assign(new Error(message),{status,...extra});
export function createRevisionStore(file){
 let queue=Promise.resolve();
 async function read(){try{const data=JSON.parse(await readFile(file,'utf8'));if(data.schema!==1||!Array.isArray(data.items))throw Error('Invalid request store');return data;}catch(e){if(e.code==='ENOENT')return{schema:1,items:[]};throw e;}}
 function serial(fn){const task=queue.then(fn);queue=task.catch(()=>{});return task;}
 return {
  list(owner){return serial(async()=>{const db=await read();return db.items.filter(x=>x.owner===owner).map(({owner,...entry})=>entry);});},
  save(owner,sequence,{text,version}){return serial(async()=>{
   if(!validSeq(sequence)||typeof text!=='string'||text.length>2000||!Number.isSafeInteger(version)||version<0)throw failure(400,'수정 요청은 2,000자 이내로 작성해 주세요.');
   const db=await read(),index=db.items.findIndex(x=>x.owner===owner&&x.sequence===sequence),previous=db.items[index];
   if((previous?.version||0)!==version)throw failure(409,'다른 창에서 요청이 변경됐습니다. 서버 내용을 확인한 뒤 다시 저장해 주세요.');
   if(index<0&&db.items.length>=5000)throw failure(507,'저장 공간이 가득 찼습니다. 채팅으로 알려 주세요.');
   const item={owner,sequence,text:text.trim(),version:version+1,updatedAt:new Date().toISOString()};
   if(index<0)db.items.push(item);else db.items[index]=item;
   await mkdir(dirname(file),{recursive:true,mode:0o700});const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(db,null,2),{mode:0o600});await rename(temp,file);
   const {owner:_,...result}=item;return result;
  });}
 };
}
export function createRevisionHandler(file){
 const store=createRevisionStore(file);
 return async(req,res,path)=>{
  if(path!=='/api/revision-requests'&&!path.startsWith('/api/revision-requests/'))return false;
  const origin=req.headers.origin,allowed=origin&&(origin===`https://${req.headers.host}`||origin===`http://${req.headers.host}`||['https://bacbaqui-web.github.io','https://radio.magamiscom.ing'].includes(origin));
  if(allowed){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, PUT, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.writeHead(allowed?204:403);res.end();return true;}
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
  try{
   const token=(req.headers.authorization||'').match(/^Bearer ([a-f0-9]{64})$/)?.[1];
   if(!token)throw failure(401,'요청 저장 연결을 확인해 주세요. 페이지를 새로고침하면 다시 연결합니다.');
   const owner=createHash('sha256').update(token).digest('hex');
   if(origin&&!allowed)throw failure(403,'이 페이지에서는 요청을 저장할 수 없습니다. 게임 서버 페이지를 열어 주세요.');
   if(req.method==='GET'&&path==='/api/revision-requests'){send(200,{items:await store.list(owner),notebook:owner.slice(0,12)});return true;}
   if(req.method!=='PUT'){send(405,{error:'지원하지 않는 요청입니다.'});return true;}
   const sequence=path.slice('/api/revision-requests/'.length);if(!validSeq(sequence))throw failure(400,'올바른 마법 조합을 선택해 주세요.');
   if(!(req.headers['content-type']||'').startsWith('application/json'))throw failure(415,'요청 형식을 확인해 주세요.');
   const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>7800)throw failure(413,'수정 요청은 2,000자 이내로 작성해 주세요.');chunks.push(chunk);}const body=Buffer.concat(chunks).toString('utf8');
   let data;try{data=JSON.parse(body);}catch{throw failure(400,'요청 내용을 읽지 못했습니다. 다시 저장해 주세요.');}
   if(!data||typeof data!=='object'||Array.isArray(data))throw failure(400,'수정 요청 내용을 확인해 주세요.');
   send(200,{item:await store.save(owner,sequence,data)});
  }catch(e){send(e.status||500,{error:e.status?e.message:'서버에 저장하지 못했습니다. 초안은 이 브라우저에 남아 있습니다. 잠시 후 다시 저장해 주세요.'});}
  return true;
 };
}
