import * as t from "@babel/types";
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { NodePath } from '@babel/traverse';
import BasePlugin from './BasePlugin';
import { getBindingIdentifierPaths } from '../../helpers/bindingsUtil';
import { pathToString, pathToStringAnnotated } from '../../helpers/pathHelpers';
import BindingIdentifier from '../BindingIdentifier';
import BaseNode from '../BaseNode';
import { TraceCfgMeta } from '../../definitions/TraceCfg';
import { unshiftScopeBlock } from '../../instrumentation/scope';
import AssignmentPattern from '../AssignmentPattern';


function getParamDefaultInitializerPath(paramPath) {
  if (paramPath.isAssignmentPattern()) {
    // e.g. returns `3` in `function f(a = 3) {}`
    return paramPath.get('right');
  }
  return null;
}

function isSupported(paramPath) {
  // TODO: `{Object,Array}Pattern

  return paramPath.isIdentifier() ||
    // TODO: paramPath.isRestElement() ||
    (paramPath.isAssignmentPattern() && paramPath.get('left').isIdentifier());
}

/**
 * Used to trace function parameters or similarly difficult-to-reach variable declarations.
 */
export default class Params extends BasePlugin {
  get paramsPath() {
    return this.node.path.get('params');
  }

  // enter() {
  //   const { paramsPath } = this;

  //   paramsPath.forEach(paramPath => {
  //     if (!isSupported(paramPath)) {
  //       // TODO: tracing the rhs would introduce new variables whose declaration would be moved into function body,
  //       //      resulting in a TypeError
  //       //    -> skip
  //       //  e.g.: function f({ x } = {}) {}
  //       const init = getParamDefaultInitializerPath(paramPath);
  //       if (init) {
  //         paramPath.get('left').skip();
  //         init.skip();
  //         this.warn(`skipped default initializer "${pathToStringAnnotated(init, true)}"`, !!init.shouldSkip);
  //       }
  //     }
  //   });
  // }

  addParamTraces = () => {
    const { paramsPath } = this;

    // -> `registerParams([traceDeclaration(tid0, p0), traceDeclaration(tid1, p1), ...])`
    return paramsPath.map(paramPath => this.addParamTrace(paramPath));
  }

  /** 
   * Dynamic {@link TraceCfgMeta#targetNode} function for default initializer (Identifier).
   * 
   * @param {AssignmentPattern} paramNode 
   * @param {NodePath} idPath 
   */
  #makeDefaultTargetNodeId = (paramNode) => {
    // move (conditional) default value to hoisted parameter declaration
    return paramNode.buildAndReplaceParam();
  };

  /**
   * Handle default initializer (not Identifier).
   * 
   * @param {AssignmentPattern} paramNode 
   * @param {BaseNode} defaultInitializerNode
   */
  #handleDefaultInitializerOther(paramNode, defaultInitializerNode, moreTraceData) {
    // this.node.logger.debug(`PARAM default initializer: ${defaultInitializerNode.debugTag}`);
    const paramPath = paramNode.path;
    const paramTraceData = {
      path: paramPath,
      node: paramNode,
      staticTraceData: {
        type: TraceType.Param
      },
      ...moreTraceData,
      meta: {
        instrument(state, traceCfg) {
          // buildAndReplaceParam();
          // TODO: fix this
          const tmp = paramNode.Traces.generateDeclaredUidIdentifier('tmp', false);
          // const paramAstNode = paramPath.node;
          const [lvalPath] = paramNode.getChildPaths();
          const lvalAstNode = lvalPath.node;
          const resolverAstNode = paramNode.buildAndReplaceParam(tmp);

          // NOTE: unshifts apply in reverse order

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
        },
        ...moreTraceData?.meta
      }
    };
    paramNode.Traces.addTrace(paramTraceData);

    // TODO: instead of this:
    //    (1) add tmp and (2) use `DefaultInitializerPlaceholder`
    //    (3) fix `ArrowFunctionExpression` afterwards
  }

  addParamTrace = (paramPath, traceType = TraceType.Param, moreTraceData = null) => {
    const paramNode = this.node.getNodeOfPath(paramPath);
    const defaultInitializerPath = getParamDefaultInitializerPath(paramPath);
    const defaultInitializerNode = defaultInitializerPath && this.node.getNodeOfPath(defaultInitializerPath);

    if (!isSupported(paramPath)) {
      this.node.addStaticNoDataPurpose(paramPath, 'UnsupportedParam');
      if (this.node.state.verbose.nyi) {
        this.warn(`[NYI] - unsupported param type: [${paramPath.node?.type}] "${pathToString(paramPath)}" in "${this.node}"`);
      }
      if (defaultInitializerNode) {
        this.#handleDefaultInitializerOther(paramNode, defaultInitializerNode);
        // else {
        //   defaultInitializerNode.Traces.ignoreThis = true;
        // }
      }
      return null;
    }

    // console.warn('addParamTrace', paramPath.isAssignmentPattern(), paramPath.get('left').isIdentifier());

    const idPaths = getBindingIdentifierPaths(paramPath);
    if (idPaths.length !== 1) {
      if (this.node.state.verbose.nyi) {
        this.warn(`[NYI] - param has more or less than 1 variable: "${pathToString(paramPath)}" in "${this.node}"`);
      }
      return null;
    }
    const idPath = idPaths[0];
    /**
     * @type {BindingIdentifier}
     */
    const idNode = this.node.getNodeOfPath(idPath);

    // parameter declaration
    const paramTraceData = {
      path: paramNode.path,
      node: paramNode,
      staticTraceData: {
        type: traceType
      },
      ...moreTraceData
    };

    // ########################################
    // parameter declaration (with defaultInitializer) [v2]
    // ########################################
    let targetNode;  // input for the build function
    if (defaultInitializerNode) {
      // NOTE: `instrumentHoisted` will move the replacement decision expression to the top of the function
      targetNode = () => this.#makeDefaultTargetNodeId(paramNode, idPath);

      // add default value as input to param trace
      // NOTE: will be overwritten by `ExecutionContextCollection.setParamInputs`, if not default
      paramTraceData.inputTraces = defaultInitializerNode.Traces.addDefaultTraces([
        defaultInitializerPath
      ]);
    }
    else {
      targetNode = idPath.node;
    }

    const declarationOnlyTrace = idNode.addOwnDeclarationTrace(targetNode, paramTraceData);
    return declarationOnlyTrace;
  }
}
