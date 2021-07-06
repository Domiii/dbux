import Collection from './Collection';

/**
 * 
 */
class StaticLoopCollection extends Collection {
  /**
   * @type {[]}
   */
  _staticLoopsByProgram = [null];

  constructor() {
    super('staticLoops');
  }

  addLoops(programId, list) {
    // store static loops
    this._staticLoopsByProgram[programId] = list;

    for (let i = 0; i < list.length; ++i) {
      const entry = list[i];

      // eslint-disable-next-line no-console
      console.assert(entry._loopId === i + 1);

      // global id over all programs
      entry.staticLoopId = this._all.length;
      delete entry._loopId;

      this.push(entry);
    }

    // -> send out
    this._sendAll(list);
  }

  getLoops(programId) {
    return this._staticLoopsByProgram[programId];
  }

  getLoop(programId, inProgramStaticId) {
    const loops = this.getLoops(programId);
    if (!loops) {
      this.logger.error("Invalid programId has no registered static loops:", programId);
      return null;
    }
    return loops[inProgramStaticId - 1];   // ids start at 1, array starts at 0
  }

  getStaticLoopId(programId, inProgramStaticId) {
    const staticLoop = this.getLoop(programId, inProgramStaticId);
    return staticLoop.staticLoopId;
  }
}

const staticLoopCollection = new StaticLoopCollection();
export default staticLoopCollection;