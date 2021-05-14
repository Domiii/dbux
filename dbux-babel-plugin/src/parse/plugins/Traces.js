import TraceType from '@dbux/common/src/core/constants/TraceType';
import { traceWrapExpression } from '../../instrumentation/trace';
// import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';


export default class Traces extends ParsePlugin {
  traces = [];


  // ###########################################################################
  // trace bookkeeping
  // ###########################################################################

  addTrace(type, staticTraceData) {
    const { path, state } = this.node;
    const { scope } = path;

    const inProgramStaticTraceId = state.traces.addTrace(path, type, staticTraceData);
    const traceIdVar = scope.generateUidIdentifier(`t${inProgramStaticTraceId}_`);

    this.traces.push({ inProgramStaticTraceId, traceIdVar, type });

    this.Verbose >= 2 && this.debug('[traceId]', traceIdVar.name, `@${this}`);
  }
  // exit() {
  // }


  // ###########################################################################
  // instrument
  // ###########################################################################

  instrument() {
    const { traces, node } = this;
    const { path, state } = node;
    const { scope } = path;

    // TODO: DataNode.varAccess

    for (const traceCfg of traces) {
      // add variable to scope
      const { /* inProgramStaticTraceId, */ traceIdVar } = traceCfg;
      scope.push({
        id: traceIdVar
      });

      // TODO: generalize to any type of trace (not just expression)
      // TODO: add DataNodes to runtime 
      // TODO: add DataNodes to dbux-code DP + UI

      traceWrapExpression(path, state, traceCfg);
    }
  }
}