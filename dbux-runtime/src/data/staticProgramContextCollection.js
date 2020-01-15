import StaticProgramContext from './StaticProgramContext';
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
    const staticProgramContext = new StaticProgramContext(programId, {
      fileName,
      filePath
    });
    
    this._all.push(staticProgramContext);
    this.send(staticProgramContext);

    return staticProgramContext;
  }
}

const staticProgramContextCollection = new StaticProgramContextCollection();
export default staticProgramContextCollection;