// Module-level store for the map picker callback to avoid passing
// non-serializable functions through React Navigation params.
let _callback = null;

export const setMapCallback = (fn) => { _callback = fn; };
export const callMapCallback = (coords) => { _callback?.(coords); _callback = null; };
