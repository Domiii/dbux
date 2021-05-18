import ParseNode from '../parseLib/ParseNode';


function concatArrays(a, b) {
  if (a && b) {
    return a.concat(b);
  }
  return a || b;
}

/**
 * Custom layer on top of generic ParseNode.
 */
export default class BaseNode extends ParseNode {
  constructor(...args) {
    super(...args);
  }


  // ###########################################################################
  // trace utility
  // ###########################################################################

  getTidIdentifier() {
    return this._traceData?.tidIdentifier;
  }

  getBindingTidIdentifier() {
    return null;
  }

  _getOrCreateInputTrace() {
    if (!this._traceData) {
      this.createInputTrace?.();
    }
    return this._traceData;
  }

  _setTraceData(traceData) {
    this._traceData = traceData;
  }


  // ###########################################################################
  // static
  // ###########################################################################

  get logger() {
    return this.constructor.logger;
  }
}