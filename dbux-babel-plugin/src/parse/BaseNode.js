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

  /**
   * @type {StaticContext}
   */
  get StaticContext() {
    return this.peekPluginForce('StaticContext');
  }

  getRealContextIdVar() {
    const { contextIdVar: realContextIdVar } = this.StaticContext;
    return realContextIdVar;
  }


  // ###########################################################################
  // get
  // ###########################################################################

  /**
   * @returns {BaseNode}
   */
  getDeclarationNode() {
    let declarationNode = this;
    let next;

    // NOTE: Babel's bindings can be recursive if a symbol name is defined multiple times inside the same scope.
    while ((next = declarationNode.getOwnDeclarationNode()) && next !== declarationNode) {
      declarationNode = next;
    }
    return declarationNode;
  }

  getOwnDeclarationNode() {
    return undefined;
  }

  getTidIdentifier() {
    if (!this._traceCfg) {
      this.warn(`Tried to "getTidIdentifier" before node trace was added (maybe the node is disabled or its syntax not yet supported?): ${this}`);
      return null;
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
   * NOTE: this is a relatively new method, to allow overriding default paths in node for further use in Plugin (amongst other use cases).
   * Only used by `ArithmeticExpression` (as it traces all children by default).
   * There are probably only few other potential use cases.
   */
  getDefaultChildPaths() {
    return this.getChildPaths();
  }

  /** ###########################################################################
   * misc
   * ##########################################################################*/

  /**
   * NOTE: same path can be wrapped multiple times.
   * This will store the latest (outer-most) version of it.
   */
  _setTraceCfg(traceData) {
    this._traceCfg = traceData;
  }

  /**
   * @protected
   */
  buildDefaultTrace() {
    // this.logger.warn(`ParseNode did not implement "buildDefaultTrace": ${this}`);
    return null;
  }

  addDefaultTrace() {
    try {
      if (!this._traceCfg) {
        const traceData = this.buildDefaultTrace();
        if (!traceData) {
          return null;
        }
        this.Traces.addTrace(traceData);
      }
      else {
        this.logger.warn(`Tried to addDefaultTrace even though, Node already has one.`);
      }
    }
    catch (err) {
      throw new NestedError(`addDefaultTrace failed for Node ${this}`, err);
    }
    return this._traceCfg;
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

  peekContextNode() {
    return this.peekPlugin('StaticContext').node;
  }


  // ###########################################################################
  // static
  // ###########################################################################

  get logger() {
    return this.constructor.logger;
  }
}