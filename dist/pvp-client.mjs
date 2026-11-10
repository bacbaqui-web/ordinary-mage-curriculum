import {PROTOCOL} from './duel.mjs?v=cast-lock-1';
export class PvpClient {
 constructor(onMessage,onDisconnect){this.onMessage=onMessage;this.onDisconnect=onDisconnect;this.ws=null;this.round=null;this.index=null;this.generation=0;}
 async connect(url){this.disconnect();const generation=this.generation;return new Promise((resolve,reject)=>{const ws=this.ws=new WebSocket(url);let ready=false;const timeout=setTimeout(()=>{ws.close();reject(Error('서버에 연결하지 못했습니다. 서버 주소와 인터넷 연결을 확인하세요.'));},8000);
 ws.onmessage=e=>{if(this.generation!==generation)return;let m;try{m=JSON.parse(e.data);}catch{return;}if(m.type==='hello'){clearTimeout(timeout);if(m.protocol!==PROTOCOL){ws.close();reject(Error('게임 버전이 다릅니다. 페이지를 새로고침하세요.'));return;}ready=true;resolve();}else if(m.type==='joined'){this.index=m.index;}else if(m.type==='start'){this.round=m.round;}this.onMessage(m);};
 ws.onclose=()=>{clearTimeout(timeout);if(this.generation!==generation)return;this.ws=null;if(!ready)reject(Error('서버에 연결하지 못했습니다. 서버 주소를 확인하세요.'));else this.onDisconnect();};ws.onerror=()=>{};
 });}
 send(message){if(this.ws?.readyState===WebSocket.OPEN)this.ws.send(JSON.stringify(message));}
 input(input){this.send({type:'input',round:this.round,input});}
 disconnect(){this.generation++;if(this.ws){this.ws.onclose=null;this.ws.close();}this.ws=null;this.round=null;this.index=null;}
}
