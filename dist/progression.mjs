export const MAX_LEVEL=9,MAX_RANK=3;
export function createProgress(loadout){const first=['q','w','e'].find(k=>loadout[k]!=='e');return {level:1,xp:0,points:0,kills:0,ranks:{q:0,w:0,e:0,[first]:1}};}
export function requiredXP(level){return 40+(level-1)*20;}
export function awardKill(state,xp){state.kills++;if(state.level>=MAX_LEVEL)return 0;state.xp+=xp;let levels=0;while(state.level<MAX_LEVEL&&state.xp>=requiredXP(state.level)){state.xp-=requiredXP(state.level);state.level++;state.points++;levels++;}if(state.level===MAX_LEVEL)state.xp=0;return levels;}
export function learn(state,key){if(!Object.hasOwn(state.ranks,key)||state.points<1||state.ranks[key]>=MAX_RANK)return false;state.ranks[key]++;state.points--;return true;}
export function mastery(state,key){return 1+Math.max(0,state.ranks[key]-1)*.15;}
