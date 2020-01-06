import { logInternalError } from '../../log/logger';

let _instance;

/**
 * Keeps track of `StaticTrace` objects that contain static code information
 */
class StaticTraceCollection {
  /**
   * @type {[]}
   */
  _staticTraces = [null];

  addTraces(programId, list) {
    // make sure, array is pre-allocated
    for (let i = this._staticTraces.length; i <= programId; ++i) {
      this._staticTraces.push(null);
    }

    // store static traces
    this._staticTraces[programId] = list;

    for (let i = 1; i < list.length; ++i) {
      if (list[i].traceId !== i) {
        logInternalError(programId, 'Invalid traceId !== its own index:', list[i].traceId, '!==', i);
      }
    }
  }

  getTraces(programId) {
    return this._staticTraces[programId];
  }

  getTrace(programId, staticId) {
    const traces = this.getTraces(programId);
    if (!traces) {
      logInternalError("Invalid programId has no registered static traces:", programId);
      return null;
    }
    return traces[staticId];
  }
}

const staticTraceCollection = new StaticTraceCollection();
export default staticTraceCollection;