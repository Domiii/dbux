export default class StaticContext {
  lastOrderId = 0;

  constructor(programId, siteData) {
    const {
      staticId, type, name, line, parentId
    } = siteData;

    this._programId = programId;
    this._staticContextId = staticId;
    this._type = type;
    this._name = name;
    this._line = line;
    this._parentId = parentId;
  }

  genContextId() {
    return ++this.lastOrderId;
  }
}