export default class StaticTraceMonitor {
  staticByDynamicIds = {};
  lastDynamicId = 0;

  constructor(staticContextId) {
    this.staticContextId = staticContextId;
  }

  genContextId(callerId) {
    return `${this.staticContextId}${callerId ? `_${callerId}` : ''}_${++this.lastDynamicId}`;
  }
}