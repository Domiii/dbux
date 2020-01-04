import { logInternalError } from '../../log/logger';

export class StaticContextCollection {
  _staticContexts = [null];

  addContexts(programId, list) {
    // make sure, array is pre-allocated
    for (let i = this._staticContexts.length; i <= programId; ++i) {
      this._staticContexts.push(null);
    }

    // add program static contexts
    this._staticContexts[programId] = list;

    for (let i = 1; i < list.length; ++i) {
      if (list[i].staticId !== i) {
        logInternalError(programId, 'Invalid staticId !== its own index:', list[i].staticId, '!==', i);
      }
    }
  }

  getContexts(programId) {
    return this._staticContexts[programId];
  }

  getContext(programId, staticContextId) {
    const contexts = this.getContexts(programId);
    if (!contexts) {
      logInternalError("Invalid programId has no registered static contexts:", programId);
      return null;
    }
    return contexts[staticContextId];
  }
}

const staticContextCollection = new StaticContextCollection();
export default staticContextCollection;