export default class StaticContext {
  lastOrderId = 0;

  constructor(staticContextId, programData, contextData) {
    this._staticContextId = staticContextId;
    this._programData = programData;
    this._contextData = contextData;
  }

  genContextId(schedulerId) {
    return ++this.lastOrderId;
  }
}