import { logInternalError } from 'dbux-common/src/log/logger';
import Collection from './Collection';

/**
 * Keeps track of `StaticTrace` objects that contain static code information
 */
class StaticTraceCollection extends Collection {
  /**
   * @type {[]}
   */
  _staticTracesByProgram = [null];

  constructor() {
    super('staticTraces');
  }

  addTraces(programId, list) {
    // make sure, array is pre-allocated
    for (let i = this._staticTracesByProgram.length; i <= programId; ++i) {
      this._staticTracesByProgram.push(null);
    }

    // store static traces
    this._staticTracesByProgram[programId] = list;

    for (let i = 1; i < list.length; ++i) {
      const entry = list[i];
      if (entry._traceId !== i) {
        logInternalError(programId, 'Invalid traceId !== its own index:', entry._traceId, '!==', i);
      }

      // global id over all programs
      entry.staticTraceId = this._all.length;
      delete entry._traceId;
      
      this._all.push(entry);
    }

    // fix up calleeId + resultCalleeId, then send out
    for (let i2 = 1; i2 < list.length; ++i2) {
      const entry2 = list[i2];
      if (entry2._calleeId) {
        const calleeTrace = this.getTrace(programId, entry2._calleeId);
        entry2.calleeId = calleeTrace.staticTraceId;
        delete entry2._calleeId;
      }
      if (entry2._resultCalleeId) {
        const calleeTrace = this.getTrace(programId, entry2._resultCalleeId);
        entry2.resultCalleeId = calleeTrace.staticTraceId;
        delete entry2._resultCalleeId;
      }

      // finally -> send out
      this._send(entry2);
    }
  }

  getTraces(programId) {
    return this._staticTracesByProgram[programId];
  }

  getTrace(programId, inProgramStaticId) {
    const traces = this.getTraces(programId);
    if (!traces) {
      logInternalError("Invalid programId has no registered static traces:", programId);
      return null;
    }
    return traces[inProgramStaticId];
  }

  getStaticTraceId(programId, inProgramStaticId) {
    const staticTrace = this.getTrace(programId, inProgramStaticId);
    return staticTrace.staticTraceId;
  }
}

const staticTraceCollection = new StaticTraceCollection();
export default staticTraceCollection;