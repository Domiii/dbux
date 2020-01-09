import { logInternalError } from '../../log/logger';

/**
 * Keeps track of `StaticTrace` objects that contain static code information
 */
class StaticTraceCollection {
  /**
   * @type {[]}
   */
  _staticTracesByProgram = [null];
  _all = [null];

  addTraces(programId, list) {
    // make sure, array is pre-allocated
    for (let i = this._staticTracesByProgram.length; i <= programId; ++i) {
      this._staticTracesByProgram.push(null);
    }

    // store static traces
    this._staticTracesByProgram[programId] = list;

    for (let i = 1; i < list.length; ++i) {
      if (list[i].traceId !== i) {
        logInternalError(programId, 'Invalid traceId !== its own index:', list[i].traceId, '!==', i);
      }

      // global id over all programs
      list[i].id = this._all.length;
      this._all.push(list[i]);
    }
  }

  getTraces(programId) {
    return this._staticTracesByProgram[programId];
  }

  getTrace(programId, staticId) {
    const traces = this.getTraces(programId);
    if (!traces) {
      logInternalError("Invalid programId has no registered static traces:", programId);
      return null;
    }
    return traces[staticId];
  }

  getAllRaw() {
    return this._all;
  }

  getById(id) {
    return this._all[id];
  }
}

const staticTraceCollection = new StaticTraceCollection();
export default staticTraceCollection;