import { logInternalError } from 'dbux-common/src/log/logger';
import Collection from './Collection';

export class StaticContextCollection extends Collection {
  _staticContextsByProgram = [null];
  
  constructor() {
    super('staticContexts');
  }

  addContexts(programId, list) {
    // make sure, array is pre-allocated
    for (let i = this._staticContextsByProgram.length; i <= programId; ++i) {
      this._staticContextsByProgram.push(null);
    }

    // add program static contexts
    this._staticContextsByProgram[programId] = list;

    for (let i = 1; i < list.length; ++i) {
      const entry = list[i];
      if (entry._staticId !== i) {
        logInternalError(programId, 'Invalid staticId !== its own index:', entry._staticId, '!==', i);
      }

      entry.programId = programId;

      // change to global id over all programs
      entry.staticId = this._all.length;
      this._all.push(entry);
      this._send(entry);
    }

    // fix-up parentId:
    for (let i = 1; i < list.length; ++i) {
      const entry = list[i];
      if (!entry._parentId) {
        continue;
      }
      const parent = this.getContext(programId, entry._parentId);
      entry.parentId = parent.staticId;
      delete entry._parentId;
    }
  }

  getContexts(programId) {
    return this._staticContextsByProgram[programId];
  }

  getContext(programId, inProgramStaticId) {
    const contexts = this.getContexts(programId);
    if (!contexts) {
      logInternalError("Invalid programId has no registered static contexts:", programId);
      return null;
    }
    return contexts[inProgramStaticId];
  }

  getStaticContextId(programId, inProgramStaticId) {
    const staticContext = this.getContext(programId, inProgramStaticId);
    return staticContext.staticId;
  }
}

const staticContextCollection = new StaticContextCollection();
export default staticContextCollection;