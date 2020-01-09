import StaticProgramContext from './StaticProgramContext';

/**
 * Keeps track of `StaticProgramContext` objects that map file ids to path and code.
 * 
 */
export class StaticProgramContextCollection {
  /**
   * @type {StaticProgramContext[]}
   */
  _all = [null];

  addProgram(programData) {
    const programId = this._all.length;
    const { fileName, filePath } = programData;
    const staticProgramContext = new StaticProgramContext(programId, {
      fileName,
      filePath
    });
    this._all.push(staticProgramContext);
    return staticProgramContext;
  }

  getById(programId) {
    return this._all[programId];
  }
}

const staticProgramContextCollection = new StaticProgramContextCollection();
export default staticProgramContextCollection;