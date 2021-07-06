import StaticCollection from './StaticCollection';


// ###########################################################################
// DataNodeCollection
// ###########################################################################

export default class DataNodeCollection extends StaticCollection {
  /**
   * Tracing a path in its entirety
   * (usually means, the trace is recorded right before the given path).
   */
  addDataNode(path, type, customArg, cfg) {
    this.checkPath(path);

    const { state } = this;

    // per-type data
    const _traceId = this._getNextId();
    let trace;
    if (traceCustomizationsByType[type]) {
      trace = traceCustomizationsByType[type](path, state, customArg);
    }
    else {
      trace = traceDefault(path, state, customArg);
    }

    // misc data
    trace._traceId = _traceId;
    trace._staticContextId = state.contexts.getCurrentStaticContextId(path);
    trace.type = type;

    // push
    this._push(trace);

    path.setData('_traceId', _traceId);

    return _traceId;
  }
}