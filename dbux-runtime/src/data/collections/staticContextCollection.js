import { logInternalError } from '../../log/logger';

export class StaticContextCollection {
  _staticContexts = [null];

  addContexts(programStaticId, list) {
    // make sure, array is pre-allocated
    for (let i = this._staticContexts.length; i <= programStaticId; ++i) {
      this._staticContexts.push(null);
    }

    // add program static contexts
    this._staticContexts[programStaticId] = list;

    for (let i = 1; i < list.length; ++i) {
      if (list[i].staticId !== i) {
        logInternalError(programStaticId, 'Invalid staticId !== its own index:', list[i].staticId, '!==', i);
      }
    }
  }

  getContexts(programStaticId) {
    return this._staticContexts[programStaticId];
  }

  getContext(programStaticId, staticContextId) {
    const contexts = this.getContexts(programStaticId);
    if (!contexts) {
      logInternalError("Invalid programStaticId has no registered static contexts:", programStaticId);
      return null;
    }
    return contexts[staticContextId];
  }
}

const staticContextCollection = new StaticContextCollection();
export default staticContextCollection;