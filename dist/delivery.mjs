// A later lightning rune changes offensive delivery, not its original element.
export function fallsFromAbove(seq){return 'qiwg'.includes(seq[0])&&seq.slice(1).includes('l');}
export function overheadDelivery(seq){return seq[0]==='l'||fallsFromAbove(seq);}
export const FALL_SECONDS=.28;
