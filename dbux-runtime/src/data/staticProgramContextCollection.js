import Collection from './Collection';

/**
 * Keeps track of `StaticProgramContext` objects that map file ids to path and code.
 * 
 */
export class StaticProgramContextCollection extends Collection {
  constructor() {
    super('staticProgramContexts');
  }

  addProgram(programData) {
    const programId = this._all.length;
    const { fileName, filePath } = programData;
    const staticProgramContext = {
      programId,
      fileName,
      filePath
    };
    
    this.push(staticProgramContext);
    this._send(staticProgramContext);

    return staticProgramContext;
  }
}

const staticProgramContextCollection = new StaticProgramContextCollection();
export default staticProgramContextCollection;