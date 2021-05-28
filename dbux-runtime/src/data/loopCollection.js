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

  loop(contextId, startRunId, inProgramStaticLoopId) {
    if (!inProgramStaticLoopId) {
      throw new Error('missing inProgramStaticLoopId');
    }

    const loop = pools.loops.allocate();
    loop.contextId = contextId;
    loop.startRunId = startRunId;
    loop.createdAt = Date.now();  // { createdAt

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

    // store unique `loopId`
    loop.loopId = this._all.length;

    this.push(loop);

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