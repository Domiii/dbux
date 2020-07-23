import { logInternalError } from '@dbux/common/src/log/logger';
import Collection from './Collection';

export class StaticContextCollection extends Collection {
  _staticContextsByProgram = [null];

  constructor() {
    super('staticContexts');
  }

  addEntries(programId, list) {
    // add program static contexts
    this._staticContextsByProgram[programId] = list;

    for (let i = 0; i < list.length; ++i) {
      const entry = list[i];

      // eslint-disable-next-line no-console
      console.assert(entry._staticId === i + 1);

      entry.programId = programId;

      // global id over all programs
      entry.staticId = this._all.length;
      delete entry._staticId;

      this._all.push(entry);
    }

    // fix-up parentId:
    for (let i = 0; i < list.length; ++i) {
      const entry = list[i];
      if (!entry._parentId) {
        continue;
      }
      const parent = this.getContext(programId, entry._parentId);
      entry.parentId = parent.staticId;
      delete entry._parentId;
    }

    // send out
    this._sendAll(list);
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
    return contexts[inProgramStaticId - 1];  // ids start at 1, array starts at 0
  }

  getStaticContextId(programId, inProgramStaticId) {
    const staticContext = this.getContext(programId, inProgramStaticId);
    return staticContext.staticId;
  }
}

const staticContextCollection = new StaticContextCollection();
export default staticContextCollection;