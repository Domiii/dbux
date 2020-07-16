import { logInternalError } from '@dbux/common/src/log/logger';
import Collection from './Collection';

/**
 * 
 */
class StaticVarAccessCollection extends Collection {
  /**
   * @type {StaticVarAccess[]}
   */
  _staticVarAccesssByProgram = [null];

  constructor() {
    super('staticVarAccesss');
  }

  addEntries(programId, list) {
    // add program static varAccesss
    this._staticVarAccesssByProgram[programId] = list;

    for (let i = 0; i < list.length; ++i) {
      const entry = list[i];

      // eslint-disable-next-line no-console
      console.assert(entry._staticId === i + 1);

      entry.programId = programId;

      // global id over all programs
      entry.staticVarAccessId = this._all.length;
      delete entry._staticId;

      this._all.push(entry);
    }

    // -> send out
    this._sendAll(list);
  }

  getVarAccesss(programId) {
    return this._staticVarAccesssByProgram[programId];
  }

  getVarAccess(programId, inProgramStaticId) {
    const varAccesss = this.getVarAccesss(programId);
    if (!varAccesss) {
      logInternalError("Invalid programId has no registered static varAccesss:", programId);
      return null;
    }
    return varAccesss[inProgramStaticId - 1];   // ids start at 1, array starts at 0
  }

  getStaticVarAccessId(programId, inProgramStaticId) {
    const staticVarAccess = this.getVarAccess(programId, inProgramStaticId);
    return staticVarAccess.staticId;
  }
}

const staticVarAccessCollection = new StaticVarAccessCollection();
export default staticVarAccessCollection;