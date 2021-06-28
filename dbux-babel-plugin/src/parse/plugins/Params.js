import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BasePlugin from './BasePlugin';
import { getBindingIdentifierPaths } from '../../helpers/bindingsUtil';
import { buildTraceWriteVar } from '../../instrumentation/builders/misc';
import { pathToString } from '../../helpers/pathHelpers';
import BindingIdentifier from '../BindingIdentifier';


function getParamDefaultValuePath(paramPath) {
  // TODO: support destructuring
  if (paramPath.isAssignmentPattern()) {
    // e.g. get `3` from `a` in `function f(a = 3) {}`
    return paramPath.get('right');
  }
  return null;
}

export default class Params extends BasePlugin {
  addParamTraces = () => {
    const { path } = this.node;
    const paramsPath = path.get('params');

    // -> `registerParams([traceDeclaration(tid0, p0), traceDeclaration(tid1, p1), ...])`
    return paramsPath.map(paramPath => this.addParamTrace(paramPath));
  }

  addParamTrace = (paramPath, traceType = TraceType.Param) => {
    // TODO: `RestElement`
    // TODO: `{Object,Array,Assignment}Pattern

    const idPaths = getBindingIdentifierPaths(paramPath);
    if (idPaths.length !== 1) {
      this.warn(`NYI - param is destructured into less or more than 1 variable: "${pathToString(paramPath)}" in "${this.node}"`);
    }
    const idPath = idPaths[0];
    /**
     * @type {BindingIdentifier}
     */
    const idNode = this.node.getNodeOfPath(idPath);

    const paramNode = this.node.getNodeOfPath(paramPath);
    const defaultValuePath = getParamDefaultValuePath(paramPath);
    const defaultValueNode = defaultValuePath && this.node.getNodeOfPath(defaultValuePath);

    // ########################################
    // parameter declaration (with defaultValue) [v1]
    // ########################################

    // let defaultValueTrace;
    // if (defaultValuePath) {
    //   // NOTE: defaultValueTrace will not be triggered if the parameter has matching argument (no default value)

    //   // const paramNode = paramPath.node;
    //   const defaultValueTraceData = {
    //     path: paramPath,
    //     scope: this.node.path.scope.parent,  // important: declare in Function's (or CatchClause's) parent scope
    //     node: paramNode,
    //     staticTraceData: {
    //       // NOTE: we use `Param` type because several algorithms depend on this.
    //       type: TraceType.Param
    //     },
    //     meta: {
    //       build: buildTraceWriteVar,
    //       targetPath: defaultValuePath,
    //       hoisted: false
    //       // moreTraceCallArgs: () => {
    //       //   return [
    //       //     // idPath.node,
    //       //     t.arrayExpression()
    //       //   ];
    //       // }
    //     }
    //   };

    //   const inputs = [defaultValuePath];
    //   defaultValueTrace = paramNode.Traces.addTraceWithInputs(defaultValueTraceData, inputs);
    // }
    // else {
    //   // no default value
    // }

    // parameter declaration (without defaultValue)
    const paramTraceData = {
      path: paramNode.path,
      node: paramNode,
      staticTraceData: {
        type: traceType
      },
      data: {},
      meta: {}
    };

    // ########################################
    // parameter declaration (with defaultValue) [v2]
    // ########################################
    let value;
    if (defaultValueNode) {
      value = () => {
        // 1. move (conditional) default value to hoisted parameter declaration
        const valueAstNode = t.assignmentExpression('=', idPath.node, paramNode.buildParam());
        // 2. remove original default value
        paramNode.path.replaceWith(idPath.node);
        return valueAstNode;
      };

      // add default value as input to param trace
      // NOTE: will be overwritten by `ExecutionContextCollection.setParamInputs`, if not default
      paramTraceData.inputTraces = defaultValueNode.Traces.addDefaultTraces([
        defaultValuePath
      ]);
    }
    else {
      value = idPath;
    }

    const declarationOnlyTrace = idNode.addOwnDeclarationTrace(value, paramTraceData);


    return declarationOnlyTrace;
  }
}