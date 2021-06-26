import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BasePlugin from './BasePlugin';
import { getBindingIdentifierPaths } from '../../helpers/bindingsUtil';
import { buildTraceWriteVar } from '../../instrumentation/builders/misc';
import { pathToString } from '../../helpers/pathHelpers';


function getParamInitialValuePath(paramPath) {
  // TODO: support destructuring
  if (paramPath.parentPath.isAssignmentPattern()) {
    // e.g. get `3` from `a` in `function f(a = 3) {}`
    return paramPath.parentPath.get('right');
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
    const idNode = this.node.getNodeOfPath(idPath);
    const initialValuePath = getParamInitialValuePath(idPath);

    let declarationTrace;
    if (initialValuePath) {
      // handle default parameter

      let writeTrace;
      // const paramNode = paramPath.node;
      const writeTraceData = {
        path: paramPath,
        scope: this.node.path.scope.parent,  // important: declare in Function's (or CatchClause's) parent scope
        node: this.node.getNodeOfPath(paramPath),
        staticTraceData: {
          type: TraceType.Param
        },
        meta: {
          build: buildTraceWriteVar,
          targetPath: initialValuePath,
          moreTraceCallArgs: () => {
            // paramPath.replaceWith(idPath.node);
            // 2. add to instrumentation trace: `var x = td(stid, twv(init(), initTid,...), [initTid])`
            return [
              idPath.node,
              t.arrayExpression([writeTrace.tidIdentifier])
            ];
          }
        }
      };

      writeTrace = idNode.Traces.addTrace(writeTraceData);

      // TODO: if (initialValuePath) -> the write trace will never get initialized, if parameter has a matching argument.
      //      -> in that case, we need to go with the default declaration trace.
    }
    else {
      const moreTraceData = {
        staticTraceData: {
          type: traceType
        },
        meta: {}
      };
      declarationTrace = idNode.addOwnDeclarationTrace(idPath, moreTraceData);
    }

    return declarationTrace;
  }
}