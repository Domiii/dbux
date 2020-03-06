import staticLoopCollection from './staticLoopCollection';
import executionContextCollection from './executionContextCollection';
import staticContextCollection from './staticContextCollection';
import Collection from './Collection';
import pools from './pools';
import valueCollection from './valueCollection';


class LoopCollection extends Collection {
  constructor() {
    super('loops');
  }

  loop(contextId, runId, inProgramStaticLoopId, type = null) {
    const loop = this._loop(contextId, runId, inProgramStaticLoopId, type, false, undefined);
    return loop;
  }

  /**
   * Expression + pop loops have results
   */
  loopWithResultValue(contextId, runId, inProgramStaticLoopId, type, value) {
    const loop = this._loop(contextId, runId, inProgramStaticLoopId, type, true, value);
    return loop;
  }

  _loop(contextId, runId, inProgramStaticLoopId, type, hasValue, value) {
    if (!inProgramStaticLoopId) {
      throw new Error('missing inProgramStaticLoopId');
    }

    const loop = pools.loops.allocate();
    loop.contextId = contextId;
    loop.runId = runId;
    loop.type = type;
    loop.createdAt = Date.now();  // { createdAt }

    // value
    valueCollection.processValue(hasValue, value, loop);

    // look-up globally unique staticLoopId
    // loop._staticLoopId = inProgramStaticLoopId;
    const context = executionContextCollection.getById(contextId);
    const {
      staticContextId
    } = context;
    const staticContext = staticContextCollection.getById(staticContextId);
    const {
      programId
    } = staticContext;
    loop.staticLoopId = staticLoopCollection.getStaticLoopId(programId, inProgramStaticLoopId);

    // generate new loopId and store
    loop.loopId = this._all.length;

    this._all.push(loop);

    // -> send out
    this._send(loop);

    return loop;
  }
}

/**
 * @type {LoopCollection}
 */
const loopCollection = new LoopCollection();
export default loopCollection;