"""Regenerate the fire source for the saved q revision request."""
import asyncio,json,os,sys,subprocess
from pathlib import Path
import numpy as np,soundfile as sf
from mcp import Client,StdioServerParameters
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'outputs/audio-fire-v4'
async def main():
 OUT.mkdir(parents=True,exist_ok=True)
 prompt='A gas burner ignites into one powerful continuous jet of blazing fire. FWOOSH, then a dense steady roaring flame and sizzling combustion fading away. Close dry recording of real fire erupting. Smooth sustained turbulent combustion, not a series of flaps. No cloth, no fabric, no wings, no wind gusts, no footsteps, no music, no voices, no bass explosion.'
 params=StdioServerParameters(command=sys.executable,args=['-m','audio_studio_mcp'],env={**os.environ,'AUDIO_STUDIO_OUTPUT_DIR':str(OUT),'PYTHONPATH':str(Path(sys.executable).parents[2]/'src')})
 async with Client(params,read_timeout_seconds=900) as c:
  record=OUT/'result.json'
  if record.exists():r=json.loads(record.read_text())
  else:
   result=await c.call_tool('generate_audio',dict(audio_type='sfx',prompt=prompt,duration_seconds=3,variations=3,seed=35181,cfg=3,steps=8,title='fire-combustion-v4',original_idea='불이 화아악 퍼지는 사운드. 옷 펄럭임 제거.'))
   if result.is_error:raise RuntimeError(str(result))
   r=json.loads(''.join(getattr(x,'text','') for x in result.content));record.write_text(json.dumps(r,ensure_ascii=False,indent=2))
  await c.call_tool('unload_models',{})
 options=[]
 for i,item in enumerate(r['candidates']):
  path=OUT/f'candidate-{i}.wav'
  subprocess.run(['ffmpeg','-v','error','-y','-i',item['path'],'-af','highpass=f=100:p=2,bass=g=-4:f=200:w=0.7','-ar','44100','-ac','1',str(path)],check=True)
  a,sr=sf.read(path);a-=a.mean();w=441;env=np.sqrt(np.mean(a[:len(a)//w*w].reshape(-1,w)**2,axis=1));active=np.flatnonzero(env>env.max()*.12)
  start=max(0,int(active[0]*w)-220);a=a[start:start+int(sr*1.65)]
  envelope=np.sqrt(np.mean(a[:len(a)//w*w].reshape(-1,w)**2,axis=1));body=envelope[10:100];score=float(np.std(body)/max(np.mean(body),1e-8))
  a[:132]*=np.linspace(0,1,132);n=min(int(sr*.25),len(a)//3);a[-n:]*=np.linspace(1,0,n)**1.5
  a*=min(10**(-5/20)/max(abs(a)),10**(-20/20)/np.sqrt(np.mean(a*a)))
  sf.write(path,a,sr,subtype='PCM_24');options.append((score,path,item,len(a)/sr,float(max(abs(a)))))
 score,path,item,duration,peak=min(options,key=lambda x:x[0]);a,sr=sf.read(path);a=a[int(sr*.08):];a[:88]*=np.linspace(0,1,88);sf.write(ROOT/'dist/audio/fire.wav',a,sr,subtype='PCM_24');duration=len(a)/sr
 mf=ROOT/'dist/audio/manifest.json';m=json.loads(mf.read_text());m['version']='clear-v3-fire-v4'
 for x in m['sounds']:
  if x['id']=='fire':x.update(seconds=round(duration,3),bytes=(ROOT/'dist/audio/fire.wav').stat().st_size,peak=round(peak,4),source=Path(item['path']).name,seed=item['seed'],prompt=r['prompt_used'],processing=dict(highpass_hz=100,low_shelf_db=-4,low_shelf_hz=200,additional_attack_trim_ms=80),selection='Lowest amplitude modulation in sustained body; no subjective listening evaluation')
 mf.write_text(json.dumps(m,ensure_ascii=False,indent=2));print('READY',path.name,'duration',duration,'peak',peak,'modulation',score,flush=True)
asyncio.run(main())
