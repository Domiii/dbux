
function getStaticContextId() {
  return 0;
}

export default class ProgramMonitor {
  /**
   * @type {ProgramStaticContext}
   */
  _programStaticContext;

  /**
   * @param {ProgramStaticContext} programStaticContext
   */
  constructor(programStaticContext) {
    this._programStaticContext = programStaticContext;
    this.push(getStaticContextId());
  }

  getProgramId() {
    return this._programStaticContext.getProgramId();
  }

  push() {

  }

  pop() {

  }

  pushCallback() {

  }

  popCallback() {

  }

  popProgram() {
    // finished initializing the program
    return this.pop(getStaticContextId());
  }
}