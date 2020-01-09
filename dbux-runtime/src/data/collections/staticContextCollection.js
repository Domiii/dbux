import { logInternalError } from '../../log/logger';

export class StaticContextCollection {
  _staticContextsByProgram = [null];
  _all = [null];

  addContexts(programId, list) {
    // make sure, array is pre-allocated
    for (let i = this._staticContextsByProgram.length; i <= programId; ++i) {
      this._staticContextsByProgram.push(null);
    }

    // add program static contexts
    this._staticContextsByProgram[programId] = list;

    for (let i = 1; i < list.length; ++i) {
      if (list[i]._staticId !== i) {
        logInternalError(programId, 'Invalid staticId !== its own index:', list[i]._staticId, '!==', i);
      }

      list[i].programId = programId;
      // change to global id over all programs
      list[i].staticId = this._all.length;
      this._all.push(list[i]);
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

  getAllRaw() {
    return this._all;
  }

  getById(id) {
    return this._all[id];
  }
}

const staticContextCollection = new StaticContextCollection();
export default staticContextCollection;