import { NodePath } from '@babel/traverse';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { getPresentableString } from '../../helpers/pathHelpers';
import { traceWrapExpression } from '../../instrumentation/trace';
import ParseNode from '../../parseLib/ParseNode';
// import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';

const makeInputTrace = {
  Literal(path) {
    return {
      node: null,
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
    return inputPaths.flat()
      .map(inputPath => {
        const node = this.node.getNodeOfPath(inputPath);
        if (!node) {
          // handle some (basic) default AST node types
          const traceData = makeInputTrace[inputPath.node.type]?.(inputPath);
          if (!traceData) {
            this.node.logger.warn(`Found unknown AST node type "${inputPath.node.type}" for input node: ${getPresentableString(inputPath)}`);
            return null;
          }
          this.addTrace(traceData);
        }
        else {
          if (!(node instanceof ParseNode)) {
            this.node.logger.warn(`ParseNode.getNodeOfPath did not return object of type "ParseNode": ${this.node}\n  (instead it returned: ${node})`);
            return null;
          }

          if (!node._traceData) {
            const rawTraceData = node.createInputTrace?.();
            if (!rawTraceData) {
              this.node.logger.warn(`ParseNode did not implement "createInputTrace": ${node}`);
              return null;
            }
            this.addTrace(rawTraceData);
          }
          return node._traceData.tidIdentifier;
        }
        return null;
      })
      .filter(node => !!node);
  }

  // ###########################################################################
  // addTrace
  // ###########################################################################

  addTrace(pathOrCfgOrArray, node, type, varNode, staticTraceData, inputTidIds) {
    if (Array.isArray(pathOrCfgOrArray)) {
      for (const traceCfg of pathOrCfgOrArray) {
        this.addTrace(traceCfg);
      }
      return;
    }

    let path = pathOrCfgOrArray;
    if (path.path) {
      ({ path, node, type, varNode, staticTraceData, inputTidIds } = pathOrCfgOrArray);
    }

    const { state } = this.node;
    const { scope } = path;
    const inProgramStaticTraceId = state.traces.addTrace(path, type, staticTraceData);
    const tidIdentifier = scope.generateUidIdentifier(`t${inProgramStaticTraceId}_`);

    const traceData = {
      path,
      node,
      inProgramStaticTraceId,
      tidIdentifier,
      type,
      varNode,
      inputTidIds
    };
    this.traces.push(traceData);
    if (node) {
      // TODO: in case of non-Node, might want to attach to `path` instead
      node._setTraceData(traceData);
    }

    this.Verbose >= 2 && this.debug('[traceId]', tidIdentifier.name, `([${inputTidIds?.map(tid => tid.name).join(',') || ''}])`, `@"${this}"`);
  }

  // ###########################################################################
  // addTraceWithInputs
  // ###########################################################################

  addTraceWithInputs(path, node, type, varNode, inputPaths, staticTraceData) {
    // also trace inputTidIds if they are `Literal` or `ReferencedIdentifier`
    const inputTidIds = this.addInputs(inputPaths);

    // this.warn(`[${this.node.name}] traceData`, tidIdentifier.name);

    return this.addTrace(path, node, type, varNode, staticTraceData, inputTidIds);
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

    // this.debug(`traces`, traces.map(t => t.tidIdentifier));
    for (const traceCfg of traces) {
      // add variable to scope
      const { /* inProgramStaticTraceId, */ path: tracePath, tidIdentifier, varNode, inputTidIds } = traceCfg;
      scope.push({
        id: tidIdentifier
      });

      const bindingTidIdentifier = varNode?.getBindingTidIdentifier();

      // TODO: generalize to any type of trace (not just expression)

      traceWrapExpression(tracePath, state, traceCfg, bindingTidIdentifier, inputTidIds);
    }
  }
}