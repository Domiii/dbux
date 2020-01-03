import { logInternalError } from '../../log/logger';

export class StaticContextCollection {
  _staticContexts = [null];

  addContexts(staticProgramId, list) {
    // make sure, array is pre-allocated
    for (let i = this._staticContexts.length; i <= staticProgramId; ++i) {
      this._staticContexts.push(null);
    }

    // add program static contexts
    this._staticContexts[staticProgramId] = list;

    for (let i = 1; i < list.length; ++i) {
      if (list[i].staticId !== i) {
        logInternalError(staticProgramId, 'Invalid staticId !== its own index:', list[i].staticId, '!==', i);
      }
    }
  }

  getContexts(staticProgramId) {
    return this._staticContexts[staticProgramId];
  }

  getContext(staticProgramId, staticContextId) {
    const contexts = this.getContexts(staticProgramId);
    if (!contexts) {
      logInternalError("Invalid staticProgramId has no registered static contexts:", staticProgramId);
      return null;
    }
    return contexts[staticContextId];
  }
}

const staticContextCollection = new StaticContextCollection();
export default staticContextCollection;