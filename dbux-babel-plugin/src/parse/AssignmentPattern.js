// import TraceType from '@dbux/common/src/types/constants/TraceType';
import template from '@babel/template';
import { LValHolderNode } from './_types';
import BaseNode from './BaseNode';
import { pathToStringAnnotated } from 'src/helpers/pathHelpers';
import { skipPath } from 'src/helpers/traversalHelpers';
// import { getAssignmentLValPlugin } from './helpers/lvalUtil';


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
 * NOTE: this is also Babel's translation of a default parameter to es5.
 * 
 * TODO: `arguments` does not work for lambda expressions.
 * However, in order to assure correct order of execution, we cannot just instrument in place...?
 */
const builddefaultInitializerAccessor = template(
  // `(arguments.length < %%i%% || arguments[%%i%%] === undefined) ? %%defaultInitializer%% : arguments[%%i%%]`
  `%%var%% === %%DefaultInitializerIndicator%% ? %%defaultInitializer%% : %%var%%`
);

/**
 * @implements {LValHolderNode}
 */
export default class AssignmentPattern extends BaseNode {
  static children = ['left', 'right'];

  enter() {
    const [leftPath, rightPath] = this.getChildPaths();

    if (rightPath && !isSupported(leftPath)) {
      // TODO: tracing the rhs would introduce new variables whose declaration would be moved into function body,
      //      resulting in a TypeError
      //    -> skip
      //  e.g.: function f({ x } = {}) {}
      skipPath(rightPath);
      // this.warn(`skipped default initializer "${pathToStringAnnotated(rightPath, true)}"`, rightPath._traverseFlags);
    }
  }

  /**
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
   * NOTE: called by {@link ./plugins/Params}
   */
  buildAndReplaceParam(state) {
    // const { path: paramPath } = this;
    // if (paramPath.parentKey === 'params') {
    const { ids: { aliases: { DefaultInitializerIndicator } } } = state;
    const [, rightPath] = this.getChildPaths();

    const args = {
      // i: t.numericLiteral(paramPath.key),
      var: this.varId,
      DefaultInitializerIndicator,
      defaultInitializer: this.defaultInitializerPath.node
    };
    const repl = builddefaultInitializerAccessor(args).expression;

    rightPath.replaceWith(DefaultInitializerIndicator);

    return repl;
  }
}
