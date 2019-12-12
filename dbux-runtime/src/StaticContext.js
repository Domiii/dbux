export default class StaticContext {
  lastDynamicId = 0;

  constructor(staticContextId, programData, contextData) {
    this._staticContextId = staticContextId;
    this._programData = programData;
    this._contextData = contextData;
  }

  genContextId(schedulerId) {
    return `${this._staticContextId}${schedulerId ? `_${schedulerId}` : ''}_${++this.lastDynamicId}`;
  }
}