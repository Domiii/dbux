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
      console.assert(entry._traceId === i);

      // global id over all programs
      entry.staticTraceId = this._all.length;
      delete entry._traceId;
      
      this._all.push(entry);
    }

    // fix up callId + resultCallId, then send out
    for (let i2 = 1; i2 < list.length; ++i2) {
      const entry2 = list[i2];
      if (entry2._callId) {
        const calleeTrace = this.getTrace(programId, entry2._callId);
        entry2.callId = calleeTrace.staticTraceId;
        delete entry2._callId;
      }
      if (entry2._resultCallId) {
        const calleeTrace = this.getTrace(programId, entry2._resultCallId);
        entry2.resultCallId = calleeTrace.staticTraceId;
        delete entry2._resultCallId;
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