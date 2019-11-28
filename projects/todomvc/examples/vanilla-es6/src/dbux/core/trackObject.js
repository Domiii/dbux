import { __dbux_error, __dbux_log, __dbux_getStackframe } from './dbuxUtil';

// ###############################################################
// trackObject
// ###############################################################

const trackedObjects = new Map();
let lastTrackedObjectId = 0;

class TrackedObject {
  constructor(obj, alias) {
    this.obj = obj;
    this.id = ++lastTrackedObjectId;
    this.alias = (alias === undefined || alias === null) ? 
      this.id : 
      alias;

    // TODO: handle children?
  }


}

export function __dbux_logObjectTrace(obj) {
  const tracked = trackedObjects.get(obj);

  if (tracked) {
    __dbux_log('[T]', tracked.alias, __dbux_getStackframe(3));
    debugger;
  }

  return obj;
}

export function trackObject(obj, alias) {
  if (!(obj instanceof Object)) {
    // NOTE: what counts as object? -> [{}, [], "s", new Map(), (new (function hi() {}))].map(x => x instanceof Object)
    __dbux_error("Invalid obj - Must be (but is not) reference type: " + JSON.stringify(obj));
  }

  const tracked = new TrackedObject(obj, alias);
  trackedObjects.set(obj, tracked);

  return tracked;
}