// The last key of a linked loop is the next cycle's first pose, not an extra held frame.
export const cycleFrames=action=>action.loop?Math.max(1,action.frames-1):action.frames;
export const loopFrame=(action,frame)=>((frame%cycleFrames(action))+cycleFrames(action))%cycleFrames(action);
