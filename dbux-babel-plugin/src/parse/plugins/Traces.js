import { NodePath } from '@babel/traverse';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { getPresentableString } from '../../helpers/pathHelpers';
import { traceWrapExpression } from '../../instrumentation/trace';
// import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';

const makeInputTrace = {
  Literal(path) {
    return {
      path,
      traceType: TraceType.ExpressionValue,
      varNode: null,
      staticTraceData: {
        dataNode: {
          // TODO: `isNew` for literals is only `true` the first time. Need dynamic `isNew` to mirror this.
          isNew: true,
          isWrite: false
        }
      }
    };
  }
};

export default class Traces extends ParsePlugin {
  traces = [];

  // ###########################################################################
  // trace inputs
  // ###########################################################################

  /**
   * NOTE: we assume inputs to be RVals.
   */
  addInputs(inputPaths) {
    inputPaths = inputPaths.flat();
    for (const inputPath of inputPaths) {
      const node = this.node.getNodeOfChildPath(inputPath);
      if (!node) {
        // handle some (basic) default AST node types
        const traceData = makeInputTrace[inputPath.node.type]?.(inputPath);
        if (!traceData) {
          this.node.logger.warn(`Found unknown AST node type "${inputPath.node.type}" for input node: ${getPresentableString(inputPath)}`);
          continue;
        }
        this.addTrace(traceData);
      }
      else {
        const inputs = node;
        // TODO
      }
    }
  }

  // ###########################################################################
  // addTrace
  // ###########################################################################

  addTrace(pathOrCfgOrArray, type, varNode, staticTraceData, inputNodes) {
    if (Array.isArray(pathOrCfgOrArray)) {
      for (const traceCfg of pathOrCfgOrArray) {
        this.addTrace(traceCfg);
      }
      return;
    }

    let path = pathOrCfgOrArray;
    if (!(pathOrCfgOrArray instanceof NodePath)) {
      ({ path, type, varNode, staticTraceData, inputNodes } = pathOrCfgOrArray);
    }
    
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

  // ###########################################################################
  // addTraceWithInputs
  // ###########################################################################

  addTraceWithInputs(path, type, varNode, inputPaths, staticTraceData) {
    // also trace inputNodes if they are `Literal` or `ReferencedIdentifier`
    const inputNodes = this.addInputs(inputPaths);

    return this.addTrace(path, type, varNode, staticTraceData, inputNodes);
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