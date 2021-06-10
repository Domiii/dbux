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

  get traceCfg() {
    return this._traceCfg;
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

  getDeclarationNode() {
    return null;
  }

  getTidIdentifier() {
    if (!this._traceCfg) {
      throw new Error(`Tried to "getTidIdentifier" before node trace was added: ${this}`);
    }
    return this._traceCfg.tidIdentifier;
  }

  getDeclarationTidIdentifier() {
    return this.getDeclarationNode()?.getTidIdentifier();
  }

  /**
   * NOTE: same path can be wrapped multiple times.
   * This will store the latest (outer-most) version of it.
   */
  _setTraceData(traceData) {
    this._traceCfg = traceData;
  }

  createDefaultTrace() {
    this.logger.warn(`ParseNode did not implement "createDefaultTrace": ${this}`);
    return null;
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