
/**
 * @param {RuntimeMonitor} runtimeMonitor 
 */
export default function patchEventTarget(runtimeMonitor) {
  if (typeof EventTarget === 'undefined') {
    // NOTE: EventTarget was only added rather recently, so not every platform will have it.
    return;
  }

  // TODO
}