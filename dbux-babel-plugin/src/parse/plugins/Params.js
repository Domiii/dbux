import * as t from "@babel/types";
import TraceType from '@dbux/common/src/types/constants/TraceType';
import BasePlugin from './BasePlugin';
import { getBindingIdentifierPaths } from '../../helpers/bindingsUtil';
import { pathToString, pathToStringAnnotated } from '../../helpers/pathHelpers';
import BindingIdentifier from '../BindingIdentifier';


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

  addParamTrace = (paramPath, traceType = TraceType.Param, moreTraceData = null) => {
    if (!isSupported(paramPath)) {
      this.node.addStaticNoDataPurpose(paramPath, 'UnsupportedParam');
      if (this.node.state.verbose.nyi) {
        this.warn(`[NYI] - unsupported param type: [${paramPath.node?.type}] "${pathToString(paramPath)}" in "${this.node}"`);
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

    const paramNode = this.node.getNodeOfPath(paramPath);
    const defaultInitializerPath = getParamDefaultInitializerPath(paramPath);
    const defaultInitializerNode = defaultInitializerPath && this.node.getNodeOfPath(defaultInitializerPath);

    // parameter declaration (without defaultInitializer)
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
    let value;
    if (defaultInitializerNode) {
      value = () => {
        // move (conditional) default value to hoisted parameter declaration
        const valueAstNode = t.assignmentExpression('=',
          idPath.node,
          paramNode.buildAndReplaceParam(this.node.state)
        );
        return valueAstNode;
      };

      // add default value as input to param trace
      // NOTE: will be overwritten by `ExecutionContextCollection.setParamInputs`, if not default
      paramTraceData.inputTraces = defaultInitializerNode.Traces.addDefaultTraces([
        defaultInitializerPath
      ]);
    }
    else {
      value = idPath;
    }

    const declarationOnlyTrace = idNode.addOwnDeclarationTrace(value, paramTraceData);
    return declarationOnlyTrace;
  }
}