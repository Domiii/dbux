export default class StaticContext {
  lastOrderId = 0;

  constructor(programId, siteData) {
    const {
      staticId, type, name, line, parentId
    } = siteData;

    this.programId = programId;
    this.staticContextId = staticId;
    this.type = type;
    this.name = name;
    this.line = line;
    this.parentId = parentId;
  }

  genOrderId() {
    return ++this.lastOrderId;
  }
}