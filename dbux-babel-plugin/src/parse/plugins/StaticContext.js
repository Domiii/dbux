import BasePlugin from './BasePlugin';

/** @typedef { import("../BindingIdentifier").default } BindingIdentifier */
/** @typedef { import("./Traces").default } Traces */

/**
 * This is for `Program`, `Function`.
 * 
 * This is not a general "Scope container".
 * To capture all scopes, one can use [Scopable](https://babeljs.io/docs/en/babel-types#scopable).
 */
export default class StaticContext extends BasePlugin {
  /**
   * @type {BindingIdentifier}
   */
  declaredBindings = [];
  /**
   * @type {Set<BindingIdentifier>}
   */
  referencedBindings = new Set();
  /**
   * @type {Set<String>}
   */
  referencedGlobals = new Set();

  bindingTraces = [];

  /**
   * @type {Map | null}
   */
  uniqueIdentifiers = null;

  /**
   * @param {BaseId} id
   */
  addReferencedBinding(id) {
    const { binding } = id;
    if (binding) {
      this.referencedBindings.add(binding);
    }
    else {
      // TODO: special variables
      //      -> `Scope.contextVariables = ["arguments", "undefined", "Infinity", "NaN"]`
      //      -> `module` and other special variables (e.g. `commonjs` introduces https://nodejs.org/docs/latest/api/modules.html#modules_the_module_scope)
      this.referencedGlobals.add(id.astNode.name);
    }
  }

  /**
   * future-work: move all context creation code here (from `Function` and `Program`)
   */
  genContext() {
    const { node: { state, path } } = this;
    const {
      contexts: { genContextId }
    } = state;

    const bodyPath = path.get('body');
    return this.contextIdVar = genContextId(bodyPath);
  }

  getAwaitContextIdVar() {
    // future-work: don't use unnamed constants (awCid)
    return this.getUniqueIdentifier('awCid');
  }

  getUniqueIdentifier(name) {
    if (!this.uniqueIdentifiers) {
      return null;
    }

    return this.uniqueIdentifiers.get(name) || null;
  }

  /**
   * Generate (if not already generated) a variable that might be shared by multiple children.
   */
  getOrGenerateUniqueIdentifier(name) {
    if (!this.uniqueIdentifiers) {
      this.uniqueIdentifiers = new Map();
    }

    let id = this.uniqueIdentifiers.get(name);
    if (!id) {
      const { scope } = this.node.path;
      this.uniqueIdentifiers.set(name, id = scope.generateUidIdentifier(name));
    }
    return id;
  }

  addAwaitContextIdVarArg(args) {
    const awaitContextIdVar = this.getAwaitContextIdVar();
    if (awaitContextIdVar) {
      args.push(awaitContextIdVar);
    }
  }


  // ###########################################################################
  // enter + exit
  // ###########################################################################

  // exit() {
  //   // const {
  //   //   node: { stack }
  //   // } = this;

  //   // const staticContext = stack.getPlugin('StaticContext');
  //   // const { declaredBindings, referencedBindings, referencedGlobals } = this;

  //   // const bindingNodes = Array.from(bindings).map(binding => {
  //   //   const node = stack.getNodeOfPath(binding.path);
  //   //   if (!node) {
  //   //     this.node.logger.warn(`Binding did not have a matching "ParseNode": ${pathToString(binding.path)}`);
  //   //   }
  //   //   return node;
  //   // }).filter(n => !!n);


  //   // TODO: trace bindings
  //   // TODO: track binding `traceId`s of used variable names in nested functions


  //   //   const name = path.node.id?.name || '(anonymous)';
  //   //   const bindings = Array.from(bindingsStack.pop());
  //   //   console.log(`${name}@${loc2s(path.node.loc)} - referenced bindings:`, [''].concat(
  //   //     bindings.map((b) => binding2s(b))
  //   //   ).join('\n  '));

  //   /**
  //    * == Scenarios ==
  //    * 
  //    * function f1() {}
  //    * const f2 = () => {};
  //    * const f3 = function ff() {};
  //    * var i;
  //    * let j;
  //    * const k = 33;
  //    * class A {}
  //    */
  // }
}