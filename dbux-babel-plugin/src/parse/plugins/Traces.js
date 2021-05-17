import TraceType from '@dbux/common/src/core/constants/TraceType';
import { traceWrapExpression } from '../../instrumentation/trace';
// import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';


export default class Traces extends ParsePlugin {
  traces = [];


  // ###########################################################################
  // trace bookkeeping
  // ###########################################################################

  addTrace(path, type, varNode, inputNodes, staticTraceData) {
    const { state } = this.node;
    const { scope } = path;

    const inProgramStaticTraceId = state.traces.addTrace(path, type, staticTraceData);
    const traceIdVar = scope.generateUidIdentifier(`t${inProgramStaticTraceId}_`);

    this.traces.push({ 
      inProgramStaticTraceId,
      traceIdVar,
      type,
      varNode,
      inputNodes
    });

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

    for (const traceCfg of traces) {
      // add variable to scope
      const { /* inProgramStaticTraceId, */ traceIdVar, varNode, inputNodes } = traceCfg;
      scope.push({
        id: traceIdVar
      });

      const bindingTidIdentifier = varNode?.getBindingTidIdentifier();
      const inputTidIds = inputNodes.map(n => n.getTidIdentifier());

      // TODO: generalize to any type of trace (not just expression)

      traceWrapExpression(path, state, traceCfg, bindingTidIdentifier, inputTidIds);
    }
  }
}