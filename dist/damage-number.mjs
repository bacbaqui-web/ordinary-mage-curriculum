// Round each final damage event once, after defense and shield absorption.
export const roundDamage=value=>Number.isFinite(value)?Math.max(0,Math.round(value)):0;
export const damageNumber=value=>roundDamage(value).toLocaleString('ko-KR');
