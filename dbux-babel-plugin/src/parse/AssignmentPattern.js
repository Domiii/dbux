// import TraceType from '@dbux/common/src/types/constants/TraceType';
import template from '@babel/template';
import { LValHolderNode } from './_types';
import BaseNode from './BaseNode';
import { skipPath } from '../helpers/traversalHelpers';
// import { getAssignmentLValPlugin } from './helpers/lvalUtil';

/** @typedef { import("./plugins/Params").default } Params */
/** @typedef { import("./plugins/AssignmentLValPattern").PatternTree } PatternTree */


function isSupported(paramPath) {
  // TODO: `RestElement` (good news: never has default initializer)
  // TODO: `{Object,Array}Pattern

  return paramPath.isIdentifier() ||
    (paramPath.isAssignmentPattern() && paramPath.get('left').isIdentifier());
}


// ###########################################################################
// AssignmentExpression
// ###########################################################################

/**
 * NOTE: this is also Babel's translation of a default parameters to es5.
 * NOTE2: we are not using `arguments` because those won't work in lambda expressions.
 * 
 * However, in order to assure correct order of execution, we cannot just instrument in place...?
 */
const buildDefaultInitializerAccessor = template(
  // `(arguments.length < %%i%% || arguments[%%i%%] === undefined) ? %%defaultInitializer%% : arguments[%%i%%]`
  `%%var%% === %%DefaultInitializerPlaceholder%% ? %%defaultInitializer%% : %%var%%`
);

/**
 * Found in {@link Params} and in {@link PatternTree} for default values.
 * 
 * @implements {LValHolderNode}
 */
export default class AssignmentPattern extends BaseNode {
  static children = ['left', 'right'];

  enter() {
    // const [leftPath, rightPath] = this.getChildPaths();

    // if (rightPath && !isSupported(leftPath)) {
    //   // TODO: tracing the rhs would introduce new variables whose declaration would be moved into function body,
    //   //      resulting in a TypeError
    //   //    -> skip
    //   //  e.g.: function f({ x } = {}) {}
    //   skipPath(rightPath);
    //   // this.warn(`skipped default initializer "${pathToStringAnnotated(rightPath, true)}"`, rightPath._traverseFlags);
    // }
  }

  /**
   * TODO: this should actually be many nodes
   * @returns {BaseNode}
   */
  getOwnDeclarationNode() {
    const [leftNode] = this.getChildNodes();
    return leftNode;
  }

  exit1() {
    const [leftNode, rightNode] = this.getChildNodes();
    this.varId = leftNode.path.node;
    this.defaultInitializerPath = rightNode?.path;
  }

  /**
   * NOTE: called by {@link Params}.
   * Adds the placeholder.
   */
  buildAndReplaceParam(state) {
    // const { path: paramPath } = this;
    // if (paramPath.parentKey === 'params') {
    const { ids: { aliases: { DefaultInitializerPlaceholder } } } = state;
    const [, rightPath] = this.getChildPaths();

    const args = {
      // i: t.numericLiteral(paramPath.key),
      var: this.varId,
      DefaultInitializerPlaceholder,
      defaultInitializer: this.defaultInitializerPath.node
    };
    const repl = buildDefaultInitializerAccessor(args).expression;

    rightPath.replaceWith(DefaultInitializerPlaceholder);

    return repl;
  }
}
