import { __dbgs_error, __dbgs_log, __dbgs_getStackframe } from './dbgsUtil';

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

    // TODO: handle children
  }
}

export function __dbgs_logObjectTrace(obj) {
  const tracked = trackedObjects.get(obj);

  if (tracked) {
    __dbgs_log('[T]', tracked.alias, __dbgs_getStackframe(3));
  }

  return obj;
}

export function trackObject(obj, alias) {
  // what counts as object? -> [{}, [], "s", new Map(), (new (function hi() {}))].map(x => x instanceof Object)
  if (!(obj instanceof Object)) {
    __dbgs_error("Invalid obj - Must be (but is not) reference type: " + JSON.stringify(obj));
  }

  const tracked = new TrackedObject(obj, alias);
  trackedObjects.set(obj, tracked);

  // TODO
}