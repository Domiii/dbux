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
  /**
   * NOTE: Managed by `plugins/Traces`
   */
  _traceData;

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