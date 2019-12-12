import StaticContext from './StaticContext';
import ProgramStaticContext from './ProgramStaticContext';

/**
 * Keeps track of `StaticContext` objects that contain all static code information,
 * and also manage dynamic ids for traces through their domain.
 * 
 */
export default class StaticContextManager {
  static _instance;
  /**
   * @type {StaticContextManager}
   */
  static get instance() {
    return this._instance || (this._instance = new StaticContextManager());
  }

  /**
   * @type {StaticContext[]}
   */
  _programStaticContexts = new Map();

  addProgram(programData) {
    const programStaticContext = new ProgramStaticContext(programId, programData);
    this._programStaticContexts.set();
    return programStaticContext;
  }

  genContextId(staticContextId, schedulerId) {
    const staticContext = this.programStaticContexts[staticContextId];
    return staticContext.genContextId(schedulerId);
  }
}