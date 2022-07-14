// import TraceType from '@dbux/common/src/types/constants/TraceType';
import * as t from "@babel/types";
import template from '@babel/template';
import { LValHolderNode } from './_types';
import BaseNode from './BaseNode';
import { skipPath } from '../helpers/traversalHelpers';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { unshiftScopeBlock } from '../instrumentation/scope';
import { getClosestAssignmentOrDeclaration, getClosestBlockParentChild } from '../helpers/pathHierarchyUtil';
import { pathToString } from '../helpers/pathHelpers';
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
 * Four cases:
 * 1. AssignmentExpression (with pattern + ExpressionStatement)
 * 2. VariableDeclaration (with pattern + ExpressionStatement)
 * 3. Params (direct or nested w/ pattern)
 * 4. ForXStatement (with pattern)
 */
export default class AssignmentPattern extends BaseNode {
  static children = ['left', 'right'];

  handler;

  get shouldInstrumentDefault() {
    return !this.handler;
    // const isHandledByParam = blockParentChild.listKey === 'params' &&
    //   this.peekPlugin('Params')?.canHandleParam(blockParentChild);
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
    const node = this;
    const { path } = node;


    // NOTE: if isInBody, assignmentOrDeclaration must exist.
    const assignmentOrDeclarationPath = getClosestAssignmentOrDeclaration(path);
    const isAssignment = assignmentOrDeclarationPath?.isAssignmentExpression() || false;

    const blockParentChild = getClosestBlockParentChild(path);
    const isInBody =
      // statement directly in body
      blockParentChild.listKey === 'body' &&
      // inline assignment, that is part of something else
      (!isAssignment || assignmentOrDeclarationPath.parentPath.isExpressionStatement());


    // this.logger.debug(`${this.debugTag} isInBody=${isInBody}, isAssignment=${isAssignment} in - [${blockParentChild.listKey}] ${pathToString(blockParentChild)}`);

    if (isInBody || isAssignment) {
      // NOTE: we don't need to fix these, since they won't cause issues of execution order
      return;
    }

    const paramTraceData = {
      path: path,
      node,
      staticTraceData: {
        type: TraceType.Param
      },
      meta: {
        instrument: (state, traceCfg) => {
          // declare `tmp` var, if this is AssignmentExpression (else it will be placed into a declaration)
          const shouldDeclareTmp = isAssignment;
          const tmp = node.Traces.generateDeclaredUidIdentifier('tmp', shouldDeclareTmp);

          // const paramAstNode = paramPath.node;
          const [lvalPath] = node.getChildPaths();
          const lvalAstNode = lvalPath.node;

          // Put `tmp` in, and get the `resolverExpression`
          const resolverExpression = node.buildAndReplaceParam(tmp);

          const shouldAddToBlock = !isInBody;


          if (shouldAddToBlock && !isAssignment) {
            const newNodes = [
              t.variableDeclaration(
                'var',
                [t.variableDeclarator(
                  lvalAstNode,
                  resolverExpression
                )]
              )
            ];
            if (shouldAddToBlock) {
              // not in body → add to body
              unshiftScopeBlock(path, newNodes);
            }
            else {
              // VariableDeclaration (in body) → insertAfter
              assignmentOrDeclarationPath.insertAfter(newNodes);
            }
          }
          else {
            // AssignmentExpression (not in body) → inline it
            // future-work: handle this case
            // E.g.: `class A {  x = ({a = 3, b = { ba = 4, bb = 5 }} = {}); }`
            // assignmentOrDeclarationPath.replaceWith(t.sequenceExpression(
            //   ...
            // ));
          }
        }
      }
    };
    node.Traces.addTrace(paramTraceData);
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

    const repl = buildDefaultInitializerAccessor(args).expression;


    // 0. (maybe replace lval)
    newVar && leftPath.replaceWith(newVar);

    // 1. replace default value with placeholder
    rightPath.replaceWith(DefaultInitializerPlaceholder);

    // 2. return the decision for replacement later
    return repl;
  }

  instrument() {
  }
}
