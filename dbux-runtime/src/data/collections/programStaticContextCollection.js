import ProgramStaticContext from './ProgramStaticContext';

let _instance;

/**
 * Keeps track of `StaticContext` objects that contain all static code information,
 * and also manage dynamic ids for traces through their domain.
 * 
 */
export class ProgramStaticContextCollection {
  /**
   * Singleton
   * @type {ProgramStaticContextCollection}
   */
  static get instance() {
    return _instance || (_instance = new ProgramStaticContextCollection());
  }

  /**
   * @type {ProgramStaticContext[]}
   */
  _programStaticContexts = [null];

  addProgram(programData) {
    const programId = this._programStaticContexts.length;
    const { fileName, filePath } = programData;
    const programStaticContext = new ProgramStaticContext(programId, {
      fileName,
      filePath
    });
    this._programStaticContexts.push(programStaticContext);
    return programStaticContext;
  }

  getProgramContext(programId) {
    return this._programStaticContexts[programId];
  }
}

const programStaticContextCollection = new ProgramStaticContextCollection();
export default programStaticContextCollection;