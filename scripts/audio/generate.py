"""Run with Audio Studio MCP's .venv/bin/python. Keeps original candidates and metadata."""
import asyncio, json, os, sys, shutil
from pathlib import Path
import numpy as np
import soundfile as sf
from mcp import Client, StdioServerParameters

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/audio-source'
DEST = ROOT / 'dist/audio'
SOUNDS = [
 ('fire', '화염', 1.8, 'A single magical fireball', 'ignites with a sharp fiery whoosh and a brief crackling burst', 'warm roaring flame, punchy bass, crisp embers'),
 ('ice', '빙결', 1.5, 'A single ice spell', 'crystallizes then snaps into sharp frozen shards', 'glassy ice crystals, brittle crack, cold shimmering tail'),
 ('lightning', '전격', 1.2, 'A single electric lightning spell', 'discharges with a sharp electric snap and a short thunder crack', 'crackling high voltage, tight bass, no long rumble'),
 ('earth', '대지', 1.5, 'A stone magic spell', 'erupts from the ground with one heavy rocky impact', 'granite cracking, gravel scattering, deep dry thud'),
 ('poison', '독', 1.5, 'A toxic magical potion burst', 'pops with a wet bubbling splash and a brief hiss', 'viscous liquid, acidic fizz, small bubbles'),
 ('barrier', '장벽', 1.8, 'A magical crystal shield', 'materializes with a clean resonant pulse and settles quickly', 'hollow glass resonance, soft metallic shimmer, rounded attack'),
 ('field', '장판', 1.8, 'A magical ground circle', 'opens with a low expanding pulse and airy shimmer', 'soft resonant energy, textured wind, deep rounded swell'),
 ('push', '밀기', 1.1, 'A compressed air magic blast', 'bursts outward with a fast forceful whoosh', 'dry rushing air, tight low punch, clean short tail'),
 ('pull', '당김', 1.4, 'A magical gravity vortex', 'sucks air inward and ends with a compact low pulse', 'reverse airy whoosh, deep hollow energy'),
 ('slash', '베기', 0.9, 'A single magical blade', 'swings rapidly through the air with one sharp slicing swoosh', 'thin metallic edge, dry fast wind'),
 ('strike', '타격', 0.9, 'A magical force punch', 'hits once with a tight heavy impact', 'dry low thump, crisp attack, very short decay'),
 ('hit', '명중', 0.6, 'A fantasy combat impact', 'lands once with a short punchy hit', 'dry leather thud and tiny crisp crack, no voice'),
 ('roll', '구르기', 0.8, 'A clothed wizard dodging', 'rolls quickly across stone with a brief cloth swish', 'soft fabric rush, muted stone scuff, no footsteps'),
 ('charge', '마법 충전', 3.0, 'A sustained magical energy field', 'hums continuously at a steady level with subtle sparkling movement', 'smooth warm low hum, delicate airy crystals, no beats or melody'),
]

async def call(c, tool, args):
 r = await c.call_tool(tool,args)
 value = ''.join(getattr(x,'text','') for x in r.content)
 if r.is_error: raise RuntimeError(value)
 return json.loads(value)

async def main():
 OUT.mkdir(parents=True,exist_ok=True); DEST.mkdir(parents=True,exist_ok=True)
 params=StdioServerParameters(command=sys.executable,args=['-m','audio_studio_mcp'],env={**os.environ,'AUDIO_STUDIO_OUTPUT_DIR':str(OUT),'PYTHONPATH':str(Path(sys.executable).parents[2]/'src')})
 manifest=[]
 async with Client(params,read_timeout_seconds=900) as c:
  for i,(key,label,duration,source,action,material) in enumerate(SOUNDS):
   record=OUT/f'{key}-result.json'
   if record.exists(): result=json.loads(record.read_text())
   else:
    result=await call(c,'generate_audio',dict(audio_type='sfx',duration_seconds=duration,variations=2,seed=1700+i*17,sound_source=source,sound_action=action,sound_material=material,sound_space='isolated close recording, dry studio, no music, no voices, no background noise',title=key,original_idea=f'일반마법사 커리큘럼 게임용 {label} 효과음'))
    record.write_text(json.dumps(result,ensure_ascii=False,indent=2))
   # Prefer an immediate onset; retain both originals for listening and replacement.
   scored=[]
   for candidate in result['candidates']:
    a,sr=sf.read(candidate['path'],always_2d=True); amp=np.max(np.abs(a),axis=1)
    active=np.flatnonzero(amp>max(.006,float(amp.max())*.08))
    if not len(active): continue
    onset=float(active[0]/sr); rms=float(np.sqrt(np.mean(a*a)))
    scored.append((onset,-rms,candidate['path']))
   if not scored: raise RuntimeError(f'Silent output: {key}')
   source_path=sorted(scored)[0][2]
   processed=await call(c,'process_audio',dict(input_audio=source_path,trim_silence=True,silence_threshold_db=-38,mono=True,normalize='peak',peak_ceiling_db=-3,loop=key=='charge',loop_crossfade_ms=180,fade_in_ms=8,fade_out_ms=70,format='wav',sample_rate=44100,title=f'{key}-game'))
   path=DEST/f'{key}.wav'; shutil.copyfile(processed['path'],path)
   a,sr=sf.read(path); assert np.isfinite(a).all() and np.max(np.abs(a))>.01
   manifest.append(dict(id=key,label=label,file=path.name,seconds=round(len(a)/sr,3),bytes=path.stat().st_size,peak=round(float(np.max(np.abs(a))),4),source=Path(source_path).name,prompt=result['prompt_used']))
   print(f'READY {key}: {len(a)/sr:.2f}s {path.stat().st_size} bytes',flush=True)
  await call(c,'unload_models',{})
 (DEST/'manifest.json').write_text(json.dumps(dict(generator='Audio Studio MCP / Stable Audio 3 medium (MLX)',selection='Automatic onset and signal checks; originals retained for listening',license='Stability AI Community License',sounds=manifest),ensure_ascii=False,indent=2))

asyncio.run(main())
