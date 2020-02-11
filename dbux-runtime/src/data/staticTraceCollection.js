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

      entry.id = this._all.length;
      // global id over all programs
      entry.staticTraceId = this._all.length;
      
      this._all.push(entry);
      this._send(entry);
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