// import TraceType from '@dbux/common/src/types/constants/TraceType';
import * as t from "@babel/types";
import template from '@babel/template';
import { LValHolderNode } from './_types';
import BaseNode from './BaseNode';
import { skipPath } from '../helpers/traversalHelpers';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { unshiftScopeBlock } from '../instrumentation/scope';
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

  handler;

  get shouldInstrumentDefault() {
    return !this.handler;
  }

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
    const [, rightNode] = this.getChildNodes();
    this.defaultInitializerAstNode = rightNode?.path?.node;
  }

  exit() {
    if (this.shouldInstrumentDefault) {
      this.#addTraceDefault();
    }
  }


  /**
   * Handle default initializer (not Identifier).
   */
  #addTraceDefault() {
    // this.node.logger.debug(`PARAM default initializer: ${defaultInitializerNode.debugTag}`);
    const paramNode = this;
    const paramPath = paramNode.path;
    const paramTraceData = {
      path: paramPath,
      node: paramNode,
      staticTraceData: {
        type: TraceType.Param
      },
      meta: {
        instrument(state, traceCfg) {
          const tmp = paramNode.Traces.generateDeclaredUidIdentifier('tmp', false);
          // const paramAstNode = paramPath.node;
          const [lvalPath] = paramNode.getChildPaths();
          const lvalAstNode = lvalPath.node;

          // NOTE: unshift applies in reverse order

          // 0. put `tmp` in
          const resolverAstNode = paramNode.buildAndReplaceParam(tmp);

          // 2. read actual values from tmp
          unshiftScopeBlock(paramPath, t.variableDeclaration(
            'var',
            [t.variableDeclarator(
              lvalAstNode,
              tmp
            )]
          ));

          // 1. resolve default value
          unshiftScopeBlock(paramPath, t.expressionStatement(resolverAstNode));
        }
      }
    };
    paramNode.Traces.addTrace(paramTraceData);
  }

  /**
   * NOTE: called by {@link Params}.
   * Adds a placeholder and returns placeholder replacement expression.
   * 
   * E.g.: `f(x = g()) { }` becomes `f(x = PLACEHOLDER) { x = isPlaceholder ? g() : ...; }`
   * @return {AstNode}
   */
  buildAndReplaceParam(newVar = null) {
    // const { path: paramPath } = this;
    // if (paramPath.parentKey === 'params') {
    const { ids: { aliases: { DefaultInitializerPlaceholder } } } = this.state;
    const [leftNode] = this.getChildNodes();
    const [leftPath, rightPath] = this.getChildPaths();

    const varId = newVar || leftNode.path.node;

    const args = {
      // i: t.numericLiteral(paramPath.key),
      var: varId,
      DefaultInitializerPlaceholder,
      defaultInitializer: this.defaultInitializerAstNode
    };

    const repl = t.assignmentExpression('=',
      varId,
      buildDefaultInitializerAccessor(args).expression
    );


    // 0. (maybe replace lval)
    newVar && leftPath.replaceWith(newVar);

    // 1. replace default value with placeholder
    rightPath.replaceWith(DefaultInitializerPlaceholder);

    // 2. return the decision for replacement later
    return repl;
  }
}
