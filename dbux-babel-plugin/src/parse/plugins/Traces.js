import TraceType from '@dbux/common/src/core/constants/TraceType';
// import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';


export default class Traces extends ParsePlugin {
  traces = [];


  // ###########################################################################
  // trace bookkeeping
  // ###########################################################################

  addTrace() {
    const { path, state } = this.node;
    const { scope } = path;

    // TODO: instrument inputs (if not already instrumented)
    // TODO: track DataNodes with inputs + outputs
    // TODO: add DataNodes to dbux-code DP + UI

    const inProgramStaticTraceId = state.traces.addTrace(path, TraceType.ExpressionResult);
    const traceIdVar = scope.generateUidIdentifier(`t${inProgramStaticTraceId}_`);

    // TODO: store trace data in `this.traces`

    this.Verbose >= 2 && this.debug('[traceId]', traceIdVar.name, `@${this}`);
    return;
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

    for (const trace of traces) {
      const { traceId } = trace;
      scope.push({
        id: traceId
      });
    }
  }
}