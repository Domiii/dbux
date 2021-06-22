import NestedError from '@dbux/common/src/NestedError';
import ParseNode from '../parseLib/ParseNode';
import StaticContext from './plugins/StaticContext';


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

  /**
   * @returns {BaseNode}
   */
  getDeclarationNode() {
    return undefined;
  }

  getTidIdentifier() {
    if (!this._traceCfg) {
      throw new Error(`Tried to "getTidIdentifier" before node trace was added: ${this}`);
    }
    return this._traceCfg.tidIdentifier;
  }

  getDeclarationTidIdentifier() {
    const decl = this.getDeclarationNode();
    if (decl) {
      if (!decl.getTidIdentifier) {
        throw new Error(`"getDeclarationNode" returned "${decl}", which has no "getTidIdentifier" in "${this}"`);
      }
      return decl.getTidIdentifier();
    }
    return undefined;
  }

  /**
   * NOTE: same path can be wrapped multiple times.
   * This will store the latest (outer-most) version of it.
   */
  _setTraceData(traceData) {
    this._traceCfg = traceData;
  }

  /**
   * @protected
   */
  buildDefaultTrace() {
    this.logger.warn(`ParseNode did not implement "buildDefaultTrace": ${this}`);
    return null;
  }

  addDefaultTrace() {
    try {
      if (!this.traceCfg) {
        const traceData = this.buildDefaultTrace();
        if (!traceData) {
          return null;
        }
        this.Traces.addTrace(traceData);
      }
    }
    catch (err) {
      throw new NestedError(`addDefaultTrace failed for Node ${this}`, err);
    }
    return this.traceCfg;
  }

  // ###########################################################################
  // Tree Accessors
  // ###########################################################################

  /**
   * @return {StaticContext}
   */
  peekStaticContext() {
    return this.peekPluginForce('StaticContext');
  }


  // ###########################################################################
  // static
  // ###########################################################################

  get logger() {
    return this.constructor.logger;
  }
}