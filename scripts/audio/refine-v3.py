"""Clarity revision: focused sources, shorter tails, subtractive EQ, conservative levels."""
import asyncio,io,json,os,sys,subprocess
from pathlib import Path
import numpy as np,soundfile as sf
from mcp import Client,StdioServerParameters
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'outputs/audio-clear-v3';DEST=OUT/'game'
# id, label, max duration, highpass Hz, low shelf dB, distinct source description.
SPEC=[
('fire','화염',1.2,110,-10,'A short burst of burning flames, crisp crackling embers and a fast fiery whoosh. Detailed dry fire texture, quick ignition, short natural decay.'),
('ice','빙결',1.1,180,-8,'Ice crystals cracking and shattering into small frozen shards. Clear brittle glass-like snaps with delicate icy tinkling, one short burst.'),
('lightning','전격',.9,140,-8,'A short high voltage electrical arc discharge. A sharp dry snap followed by irregular buzzing sparks and quick sizzling decay.'),
('earth','대지',1.2,85,-9,'Granite cracking and gravel scattering onto a stone floor. One firm rocky impact followed by detailed dry pebble clicks and scraping grit.'),
('poison','독',1.1,120,-3,None),
('barrier','장벽',1.3,200,-8,'A small crystal bowl struck once, clear rounded glass chime with a brief shimmering resonance. Pure delicate protective magic sound.'),
('field','장판',1.3,180,-8,'Fine sand sweeping in a circle with a soft airy shimmering resonance. A gentle textured magical sweep, light sparkling particles, short decay.'),
('push','밀기',.7,100,-5,None),
('pull','당김',1.0,140,-8,'A short reverse air whoosh drawing inward, with a hollow midrange suction sound and a clean quiet ending. No impact.'),
('slash','베기',.6,160,-8,'One fast sword swing cutting the air. Crisp narrow swish and a subtle metallic edge, quick attack and short dry decay.'),
('strike','타격',.55,100,-10,'A wooden staff hitting a leather shield once. A firm dry knock with a clear crack and compact woody body, very short decay.'),
('hit','명중',.35,120,-7,None),
('roll','구르기',.6,100,-5,None),
('charge','마법 충전',3.4,250,-10,'A quiet continuous airy magical shimmer, delicate glass overtones and softly swirling air. Steady gentle texture without rhythm, melody, impacts or swelling bass.')]
REUSE={'poison':('audio-fantasy-v2',9317),'push':('audio-source',1819),'hit':('audio-source',1887),'roll':('audio-source',1904)}
async def call(c,name,args):
 r=await c.call_tool(name,args);text=''.join(getattr(x,'text','') for x in r.content)
 if r.is_error:raise RuntimeError(text)
 return json.loads(text)
def signal(path):
 a,sr=sf.read(path,always_2d=True);a=a.mean(axis=1);a-=a.mean();return a,sr
def span(a,sr):
 n=int(sr*.01);env=np.sqrt(np.mean(a[:len(a)//n*n].reshape(-1,n)**2,axis=1));hits=np.flatnonzero(env>max(.001,float(env.max())*.035))
 if not len(hits):return None
 return max(0,int(hits[0]*n-sr*.012)),min(len(a),int((hits[-1]+1)*n+sr*.08))
def low_share(a,sr):
 f=np.fft.rfftfreq(len(a),1/sr);p=np.abs(np.fft.rfft(a-a.mean()))**2;return float(p[(f>=35)&(f<300)].sum()/max(p[f>=35].sum(),1e-20))
async def main():
 OUT.mkdir(parents=True,exist_ok=True);DEST.mkdir(exist_ok=True);manifest=[];report=[]
 params=StdioServerParameters(command=sys.executable,args=['-m','audio_studio_mcp'],env={**os.environ,'AUDIO_STUDIO_OUTPUT_DIR':str(OUT),'PYTHONPATH':str(Path(sys.executable).parents[2]/'src')})
 async with Client(params,read_timeout_seconds=900) as c:
  for i,(key,label,cap,hp,shelf,prompt) in enumerate(SPEC):
   if prompt:
    record=OUT/f'{key}-result.json'
    result=json.loads(record.read_text()) if record.exists() else await call(c,'generate_audio',dict(audio_type='sfx',prompt=prompt+' Isolated close studio recording. No music or voices. No bass boom or thunder.',duration_seconds=4 if key=='charge' else 2,variations=3,seed=24100+i*37,cfg=1,steps=8,title=key+'-clear-v3',original_idea='저음 줄이고 마법별 소리가 선명하게'))
    record.write_text(json.dumps(result,ensure_ascii=False,indent=2));candidates=result['candidates'];folder=OUT
   else:
    oldfolder,seed=REUSE[key];folder=ROOT/'outputs'/oldfolder;result=json.loads((folder/f'{key}-result.json').read_text());candidates=[x for x in result['candidates'] if x['seed']==seed]
   options=[]
   for j,item in enumerate(candidates):
    tmp=OUT/f'{key}-{j}-filtered.wav'
    # Remove excess lows rather than boosting highs or flattening every sound.
    filters=f'highpass=f={hp}:p=2,bass=g={shelf}:f=220:w=0.7'
    if key=='ice':filters+=',treble=g=-8:f=5500,lowpass=f=8500:p=2'
    elif key in ['lightning','earth','field']:filters+=',treble=g=-4:f=6000'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',item['path'],'-af',filters,'-ar','44100','-ac','1','-c:a','pcm_s24le',str(tmp)],check=True)
    a,sr=signal(tmp);region=span(a,sr)
    if region is None:continue
    start,end=region;a=a[start:min(end,start+int(cap*sr))]
    if len(a)<sr*.12:continue
    share=low_share(a,sr);freq=np.fft.rfftfreq(len(a),1/sr);power=np.abs(np.fft.rfft(a))**2;high=float(power[freq>8000].sum()/max(power.sum(),1e-20));score=max(0,share-.5)*4+max(0,high-.25)*3+abs(np.log(max(.1,len(a)/sr)/cap))*.25
    options.append((score,a,sr,item,share))
   if not options:raise RuntimeError('No usable signal: '+key)
   _,a,sr,item,share=min(options,key=lambda x:x[0])
   if key=='charge':
    n=min(int(.25*sr),len(a)//4);t=np.linspace(0,1,n);a=np.concatenate([a[-n:]*(1-t)+a[:n]*t,a[n:-n]])
   else:
    attack=min(int(.003*sr),len(a));tail=min(int(.1*sr),len(a)//3);a[:attack]*=np.linspace(0,1,attack);a[-tail:]*=np.linspace(1,0,tail)**2
   peak=np.max(np.abs(a));rms=np.sqrt(np.mean(a*a));target=-26 if key=='charge' else -20
   gain=min(10**(-5/20)/max(peak,1e-9),10**(target/20)/max(rms,1e-9));a*=gain
   sf.write(DEST/(key+'.wav'),a,sr,subtype='PCM_24');old,osr=signal(ROOT/'dist/audio'/f'{key}.wav')
   info=dict(id=key,label=label,file=key+'.wav',seconds=round(len(a)/sr,3),bytes=(DEST/(key+'.wav')).stat().st_size,peak=round(float(np.max(np.abs(a))),4),source=Path(item['path']).name,seed=item['seed'],prompt=result['prompt_used'],processing=dict(highpass_hz=hp,low_shelf_db=shelf,low_shelf_hz=220))
   manifest.append(info);report.append(dict(id=key,old_low_share=round(low_share(old,osr),4),new_low_share=round(low_share(a,sr),4),seconds=info['seconds'],rms_db=round(20*np.log10(np.sqrt(np.mean(a*a))),2),seam_jump=float(abs(a[0]-a[-1]))))
   print(f'READY {key}: {info["seconds"]}s, bass share {report[-1]["old_low_share"]:.0%} -> {report[-1]["new_low_share"]:.0%}',flush=True)
  await call(c,'unload_models',{})
 (DEST/'manifest.json').write_text(json.dumps(dict(version='clear-v3',generator='Audio Studio MCP / Stable Audio 3 medium (MLX)',style='저음 절제, 마법별 질감, 짧은 잔향',selection='Focused prompts and signal checks; subjective listening assessment not performed',license='Stability AI Community License',sounds=manifest),ensure_ascii=False,indent=2))
 (OUT/'comparison.json').write_text(json.dumps(report,indent=2))
asyncio.run(main())
