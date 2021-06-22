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
    // TODO: `{Object,Array,Assignment}Pattern on `RestElement`

    const idPaths = getBindingIdentifierPaths(paramPath);
    if (idPaths.length !== 1) {
      this.warn(`NYI - param is destructured into less or more than 1 variable: "${pathToString(paramPath)}" in "${this.node}"`);
    }
    const idPath = idPaths[0];
    const idNode = this.node.getNodeOfPath(idPath);
    const initialValuePath = getParamInitialValuePath(idPath);
    const moreTraceData = {
      staticTraceData: {
        type: traceType
      },
      meta: {}
    };

    let definitionPath;
    if (initialValuePath) {
      // handle default parameter
      definitionPath = null;  // NOTE: we will inject the value in post (moreTraceArgs)

      const writeTraceData = {
        path: paramPath,
        // node: idNode,
        staticTraceData: {
          type: TraceType.WriteVar
        },
        meta: {
          build: buildTraceWriteVar,
          targetPath: initialValuePath
        }
      };

      const writeTrace = idNode.Traces.addTrace(writeTraceData);

      moreTraceData.meta.moreTraceArgs = () => {
        // hackfix: instrument as we go
        // 1. remove default value: `x = twv(init(), initTid,...)` becomes `x`
        paramPath.replace(idPath.node);
        // 2. add to instrumentation trace: `var x = td(stid, twv(init(), initTid,...), [initTid])`
        return [
          initialValuePath.node,
          t.arrayExpression([writeTrace.tidIdentifier])
        ];
      };
    }
    else {
      definitionPath = idPath;
    }

    const declTrace = idNode.addOwnDeclarationTrace(definitionPath, moreTraceData);
    return declTrace;
  }
}