"""Generate the heavy-fantasy replacement pack; keep all source candidates."""
import asyncio, json, os, sys, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from mcp import Client, StdioServerParameters
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'outputs/audio-fantasy-v2'; DEST=OUT/'game'
SOUNDS=[
('fire','화염',3.0,1.5,'A powerful fantasy fire spell exploding outward. Deep bass ignition, thick roaring flame rush, gritty crackling embers decaying naturally. A single forceful attack followed by a rich fiery tail.'),
('ice','빙결',2.8,1.3,'A heavy fantasy ice spell. A deep frozen pressure burst fractures into large resonating crystal shards, with a cold shimmering glass tail. One solid bass impact followed by delicate scattered ice.'),
('lightning','전격',3.0,1.4,'A powerful arcane lightning strike. Sharp electrical snap over a deep thunderous bass impact, dense crackling electricity rapidly dispersing into a low rumbling tail. One strike, close and forceful.'),
('earth','대지',3.0,1.5,'A massive stone pillar erupting from the ground by magic. Heavy low rock impact, thick granite grinding and cracking, scattered gravel settling. Weighty physical force with a natural short rocky decay.'),
('poison','독',2.8,1.4,'A sinister fantasy poison spell bursting. Deep wet resonant pop, thick viscous liquid splash, layered acidic sizzling and bubbles collapsing. One dark magical impact with a textured bubbling tail.'),
('barrier','장벽',3.0,1.8,'A large magical protective shield materializing. A deep rounded impact blooms into layered hollow crystal resonance and a low arcane energy hum, then fades smoothly. Powerful solid protective magic.'),
('field','장판',3.5,2.0,'A large arcane circle activating on stone ground. Deep resonant pulse expands outward with swirling textured magical air and low shimmering energy. Slow broad decay after one heavy activation.'),
('push','밀기',2.5,1.0,'A forceful magical shockwave pushing air outward. Deep compressed bass punch followed by a broad rushing air whoosh and a short airy decay. One strong gust, heavy and physical.'),
('pull','당김',3.0,1.6,'A dark gravity spell pulling air inward. Low resonant suction vortex, twisting airy rush gathering into a heavy hollow bass pulse and short fading resonance. One powerful magical pull.'),
('slash','베기',2.2,.75,'A heavy enchanted blade slicing through air once. A broad fast cutting whoosh with a low body, a clean metallic edge and a brief resonant airy tail. Powerful cinematic sword swing.'),
('strike','타격',2.3,.8,'A heavy magical fist striking solid armor once. Deep punchy bass thump layered with a crisp hard impact, a short gritty crunch and a compact resonant tail. Weighty close combat hit.'),
('hit','명중',1.8,.5,'A single heavy fantasy combat hit on leather armor. Tight low thump, clear dry crack, brief crunchy texture and quick decay. Solid punchy impact, restrained high frequencies.'),
('roll','구르기',2.2,.75,'A robed fighter doing one quick dodge roll on stone. Thick fabric swoosh followed by a muted weighty body landing and a short gritty stone scuff. Compact physical movement.'),
('charge','마법 충전',6.0,5.5,'Continuous steady deep arcane energy drone. Smooth low resonant hum with subtle dark airy swirling texture and very soft crystalline overtones. Even sustained sound without impacts, rhythmic beats, melody or rising pitch.')]
async def call(c,tool,args):
 r=await c.call_tool(tool,args);t=''.join(getattr(x,'text','') for x in r.content)
 if r.is_error:raise RuntimeError(t)
 return json.loads(t)
def inspect(path,target):
 a,sr=sf.read(path,always_2d=True);mono=a.mean(axis=1);win=int(sr*.01);env=np.sqrt(np.mean(mono[:len(mono)//win*win].reshape(-1,win)**2,axis=1));threshold=max(.001,float(env.max())*.025);active=np.flatnonzero(env>threshold)
 if not len(active):return None
 begin=max(0,int(active[0]*win-sr*.025));end=min(len(mono),int((active[-1]+1)*win+sr*.18));duration=(end-begin)/sr
 # Prefer a substantial effect with a real tail, not the previous tiny transients.
 score=abs(np.log(max(.05,duration)/target))
 return score,begin/sr,end/sr,duration
async def main():
 OUT.mkdir(parents=True,exist_ok=True);DEST.mkdir(exist_ok=True);manifest=[]
 params=StdioServerParameters(command=sys.executable,args=['-m','audio_studio_mcp'],env={**os.environ,'AUDIO_STUDIO_OUTPUT_DIR':str(OUT),'PYTHONPATH':str(Path(sys.executable).parents[2]/'src')})
 async with Client(params,read_timeout_seconds=900) as c:
  for i,(key,label,seconds,target,prompt) in enumerate(SOUNDS):
   record=OUT/f'{key}-result.json'
   args=dict(audio_type='sfx',prompt=prompt+' Isolated studio sound effect, no music, no speech.',duration_seconds=seconds,variations=3,seed=9200+i*29,cfg=3,negative_prompt='music, voice, speech, singing, melody, thin, weak, clipping, harsh high pitched squeal',steps=8,title=key+'-fantasy-v2',original_idea='묵직한 판타지: 낮은 울림과 선명한 타격감')
   result=json.loads(record.read_text()) if record.exists() else await call(c,'generate_audio',args)
   record.write_text(json.dumps(result,ensure_ascii=False,indent=2))
   scored=[]
   for item in result['candidates']:
    info=inspect(item['path'],target)
    if info:scored.append((*info,item))
   if not scored:raise RuntimeError('Silent candidates: '+key)
   score,start,end,duration,item=min(scored,key=lambda s:s[0])
   processed=await call(c,'process_audio',dict(input_audio=item['path'],start_seconds=start,end_seconds=end,trim_silence=False,mono=True,normalize='peak',peak_ceiling_db=-4,loop=key=='charge',loop_crossfade_ms=350,fade_in_ms=0 if key=='charge' else 4,fade_out_ms=0 if key=='charge' else 120,format='wav',sample_rate=44100,title=key+'-prepared-v2'))
   # Restrained bass emphasis and softer extreme highs; leave enough headroom for layered spells.
   tmp=OUT/(key+'-eq.wav')
   subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',processed['path'],'-af','highpass=f=35,bass=g=3:f=130:w=0.7,lowpass=f=10500','-c:a','pcm_s24le',str(tmp)],check=True)
   a,sr=sf.read(tmp);a-=np.mean(a)
   if key=='charge':
    n=min(int(sr*.25),len(a)//4);t=np.linspace(0,1,n);a=np.concatenate([a[-n:]*(1-t)+a[:n]*t,a[n:-n]])
   peak=np.max(np.abs(a));a*=10**(-4/20)/max(peak,1e-9)
   # For a sustained loop, use the crossfaded signal without artificial silent gaps.
   sf.write(DEST/(key+'.wav'),a,sr,subtype='PCM_24')
   manifest.append(dict(id=key,label=label,file=key+'.wav',seconds=round(len(a)/sr,3),bytes=(DEST/(key+'.wav')).stat().st_size,peak=round(float(np.max(np.abs(a))),4),source=Path(item['path']).name,seed=item['seed'],prompt=result['prompt_used']))
   print(f'READY {key}: {len(a)/sr:.2f}s from 3 candidates',flush=True)
  await call(c,'unload_models',{})
 (DEST/'manifest.json').write_text(json.dumps(dict(version='fantasy-v2',generator='Audio Studio MCP / Stable Audio 3 medium (MLX)',style='묵직한 판타지: 낮은 울림과 선명한 타격감',selection='Duration and signal checks; not a subjective listening evaluation',license='Stability AI Community License',sounds=manifest),ensure_ascii=False,indent=2))
asyncio.run(main())
