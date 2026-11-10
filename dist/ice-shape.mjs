// World-space variation keeps overlapping footprints joined and stable over time.
export function iceEdgeOffset(x,z){return .13*Math.sin(x*3.7+Math.sin(z*2.1))+.09*Math.sin(z*5.3-x*1.8)+.045*Math.sin(x*10.1+z*8.3);}
export function iceContains(zone,x,z){return zone.kind==='i'&&zone.life>0&&Math.hypot(x-zone.x,z-zone.z)<(zone.radius+iceEdgeOffset(x,z))*Math.min(1,zone.life/.4);}
