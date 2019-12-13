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
   * Singleton
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
    this._programStaticContexts.set(programId, programStaticContext);
    return programStaticContext;
  }

  genContextId(staticContextId, schedulerId) {
    const staticContext = this._programStaticContexts[staticContextId];
    return staticContext.genContextId(schedulerId);
  }
}