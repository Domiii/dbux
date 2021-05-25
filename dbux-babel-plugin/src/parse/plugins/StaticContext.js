import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';

/** @typedef { import("../BindingIdentifier").default } BindingIdentifier */
/** @typedef { import("./BindingNode").default } BindingNode */
/** @typedef { import("./Traces").default } Traces */

/**
 * This is for `Program`, `Function`.
 * 
 * This is not a general "Scope container".
 * To capture all scopes, one can use [Scopable](https://babeljs.io/docs/en/babel-types#scopable).
 */
export default class StaticContext extends ParsePlugin {
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
   * @param {BaseId} id
   */
  addReferencedBinding(id) {
    const { binding } = id;
    if (binding) {
      this.referencedBindings.add(binding);
    }
    else {
      this.referencedGlobals.add(id.astNode.name);
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
  //   //     this.node.logger.warn(`Binding did not have a matching "ParseNode": ${getPresentableString(binding.path)}`);
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