import ParseNode from '../parseLib/ParseNode';
import StaticContext from './plugins/StaticContext';
import Traces from './plugins/Traces';


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
  static plugins = ['Traces'];

  /**
   * NOTE: Managed by `plugins/Traces`
   */
  _traceCfg;

  constructor(...args) {
    super(...args);
  }

  /**
   * @return {import('./plugins/Traces').default}
   */
  get Traces() {
    return this.getPlugin('Traces');
  }


  // ###########################################################################
  // trace utility
  // ###########################################################################

  getTidIdentifier() {
    return this._traceCfg?.tidIdentifier;
  }

  getBindingTidIdentifier() {
    return null;
  }

  _setTraceData(traceData) {
    this._traceCfg = traceData;
  }

  // ###########################################################################
  // Tree Accessors
  // ###########################################################################

  /**
   * @return {StaticContext}
   */
  peekStaticContext() {
    return this.stack.peekPlugin('StaticContext');
  }


  // ###########################################################################
  // static
  // ###########################################################################

  get logger() {
    return this.constructor.logger;
  }
}