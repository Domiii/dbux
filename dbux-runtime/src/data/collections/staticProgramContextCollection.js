import StaticProgramContext from './StaticProgramContext';

/**
 * Keeps track of `StaticProgramContext` objects that map file ids to path and code.
 * 
 */
export class StaticProgramContextCollection {
  /**
   * @type {StaticProgramContext[]}
   */
  _contexts = [null];

  addProgram(programData) {
    const programId = this._contexts.length;
    const { fileName, filePath } = programData;
    const staticProgramContext = new StaticProgramContext(programId, {
      fileName,
      filePath
    });
    this._contexts.push(staticProgramContext);
    return staticProgramContext;
  }

  getProgramContext(programId) {
    return this._contexts[programId];
  }
}

const staticProgramContextCollection = new StaticProgramContextCollection();
export default staticProgramContextCollection;