// Input stays locked through charging and the release pose.
export const CAST_RELEASE_SECONDS=10/12;
export function castControlsLocked(actor,charge=actor.charge){return !!charge?.active||(actor.castControlLock||0)>0||(actor.iceCastLock||0)>0;}
