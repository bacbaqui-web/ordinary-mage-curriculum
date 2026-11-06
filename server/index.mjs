import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomInt,randomUUID} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {Duel,STEP,PROTOCOL,validInput} from '../dist/duel.mjs';
import {validLoadout,DEFAULT_LOADOUT} from '../dist/live-loadout.mjs';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
export function createGameServer({maxRooms=16}={}){
 const rooms=new Map();
 const server=http.createServer(async(req,res)=>{try{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true,protocol:PROTOCOL,rooms:rooms.size}));}
  let file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403);return res.end();}
  if(!(await stat(file)).isFile()){res.writeHead(404);return res.end();}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404);res.end('페이지를 찾을 수 없습니다.');}});
 const wss=new WebSocketServer({server,path:'/pvp',maxPayload:4096,perMessageDeflate:false});
 function send(ws,data){if(ws?.readyState===WebSocket.OPEN){if(ws.bufferedAmount>2_000_000){ws.close(1013,'connection too slow');return;}ws.send(JSON.stringify(data));}}
 const error=(ws,message)=>send(ws,{type:'error',message});
 function broadcast(room,data){for(const p of room.players)send(p?.ws,data);}
 function lobby(room){broadcast(room,{type:'lobby',code:room.code,phase:room.phase,players:room.players.map(p=>p?{ready:p.ready,loadout:p.loadout}:null)});}
 function leave(ws){const room=ws.room;if(!room)return;ws.room=null;const index=room.players.findIndex(p=>p?.ws===ws);if(index<0)return;room.players[index]=null;const other=room.players[1-index];if(other){broadcast(room,{type:'opponentLeft',message:room.phase==='playing'?'상대가 나갔습니다. 이번 경기는 종료됩니다.':'상대가 방을 나갔습니다. 새 친구를 기다립니다.'});other.ready=false;}
  room.core?.dispose();room.core=null;room.inputs=[];room.phase='waiting';room.round=null;room.changed=Date.now();if(!other)rooms.delete(room.code);else lobby(room);
 }
 function start(room){room.core?.dispose();room.core=new Duel(room.players.map(p=>p.loadout));room.inputs=[];room.round=randomUUID();room.phase='countdown';room.startsAt=Date.now()+3000;broadcast(room,{type:'start',round:room.round,loadouts:room.players.map(p=>p.loadout),state:room.core.snapshot(),countdown:3});}
 wss.on('connection',ws=>{
  if(wss.clients.size>80){ws.close(1013,'server full');return;}
  ws.alive=true;ws.rateAt=Date.now();ws.rate=0;ws.on('pong',()=>ws.alive=true);send(ws,{type:'hello',protocol:PROTOCOL});
  ws.on('message',raw=>{try{
   const now=Date.now();if(now-ws.rateAt>1000){ws.rateAt=now;ws.rate=0;}if(++ws.rate>150){ws.close(1008,'input rate exceeded');return;}
   const m=JSON.parse(raw.toString());if(!m||typeof m!=='object')return;
   if(m.type==='ping'){send(ws,{type:'pong',at:m.at});return;}
   if(m.type==='leave'){leave(ws);return;}
   if(m.type==='create'||m.type==='join'){
    if(ws.room){error(ws,'이미 방에 들어와 있습니다. 방을 나간 뒤 다시 시도하세요.');return;}
    let room;if(m.type==='create'){
     if(rooms.size>=maxRooms){error(ws,'대전 서버가 가득 찼습니다. 잠시 뒤 다시 시도하세요.');return;}
     const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code;do{code=Array.from({length:6},()=>alphabet[randomInt(alphabet.length)]).join('');}while(rooms.has(code));
     room={code,players:[null,null],phase:'waiting',inputs:[],changed:now,core:null};rooms.set(code,room);
    }else{const code=String(m.code||'').trim().toUpperCase();room=rooms.get(code);if(!room){error(ws,'방을 찾을 수 없습니다. 방 코드를 확인하세요.');return;}if(room.players.every(Boolean)){error(ws,'이미 두 사람이 들어온 방입니다. 다른 방을 이용하세요.');return;}}
    const index=room.players.findIndex(p=>!p);room.players[index]={ws,ready:false,loadout:{...DEFAULT_LOADOUT}};ws.room=room;ws.index=index;room.changed=now;send(ws,{type:'joined',code:room.code,index});lobby(room);return;
   }
   const room=ws.room;if(!room)return;const player=room.players[ws.index];room.changed=now;
   if(m.type==='ready'&&['waiting','ended'].includes(room.phase)){
    if(!validLoadout(m.loadout)){error(ws,'서로 다른 마법 세 개를 선택하세요.');return;}player.loadout={q:m.loadout.q,w:m.loadout.w,e:m.loadout.e};player.ready=!!m.ready;lobby(room);if(room.players.every(p=>p?.ready))start(room);return;
   }
   if(m.type==='input'&&room.phase==='playing'&&m.round===room.round&&validInput(m.input)&&room.inputs.length<240)room.inputs.push({id:ws.index,input:m.input});
  }catch{error(ws,'요청을 읽지 못했습니다. 방에 다시 접속하세요.');}});
  ws.on('close',()=>leave(ws));ws.on('error',()=>{});
 });
 const timer=setInterval(()=>{const now=Date.now();for(const room of rooms.values()){
  if(room.phase==='countdown'){if(now<room.startsAt)continue;room.phase='playing';broadcast(room,{type:'go',round:room.round});}
  if(room.phase==='playing'){
   const inputs=room.inputs.splice(0);for(const {id,input} of inputs)room.core.input(id,input);room.core.step(STEP);broadcast(room,{type:'tick',round:room.round,inputs,state:room.core.snapshot()});
   if(room.core.finished){room.phase='ended';for(const p of room.players)p.ready=false;lobby(room);}
  }else if(now-room.changed>30*60*1000){for(const p of [...room.players])p?.ws.close(1000,'room expired');}
 }},STEP*1000);
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},10000);
 async function close(){clearInterval(timer);clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();for(const room of rooms.values())room.core?.dispose();await new Promise(r=>wss.close(r));await new Promise(r=>server.close(r));}
 return {server,rooms,close};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=createGameServer({maxRooms:Number(process.env.MAX_ROOMS)||4});const port=Number(process.env.PORT||8787),host=process.env.HOST||'0.0.0.0';app.server.listen(port,host,()=>console.log(`마법 대전 서버: http://${host}:${port}`));for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>app.close().then(()=>process.exit(0)));
}
