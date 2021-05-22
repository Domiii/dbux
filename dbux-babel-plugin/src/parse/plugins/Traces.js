// import { NodePath } from '@babel/traverse';
// import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
// import TraceType from '@dbux/common/src/core/constants/TraceType';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { getPresentableString } from '../../helpers/pathHelpers';
import { traceWrapExpression, traceWrapWrite, traceDeclaration } from '../../instrumentation/trace';
import ParseNode from '../../parseLib/ParseNode';
// import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';

const makeInputTrace = {
  // Literal(path) {
  // }
};

function getInstrumentPath(traceCfg) {
  const {
    path: tracePath,
    meta: {
      replacePath
    } = EmptyObject
  } = traceCfg;
  return replacePath || tracePath;
}

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
          return this.addTrace(traceData);
        }
        else {
          if (!(node instanceof ParseNode)) {
            this.node.logger.warn(`ParseNode.getNodeOfPath did not return object of type "ParseNode": ${this.node}\n  (instead it returned: ${node})`);
            return null;
          }

          if (!node._traceCfg) {
            const rawTraceData = node.createInputTrace?.();
            if (!rawTraceData) {
              this.node.logger.warn(`ParseNode did not implement "createInputTrace": ${node}`);
              return null;
            }
            this.addTrace(rawTraceData);
          }
          return node._traceCfg;
        }
      })
      .filter(node => !!node);
  }

  // ###########################################################################
  // addTrace
  // ###########################################################################

  /**
   * TODO: fix order of `staticTraceId`
   */
  addTrace(traceDataOrArray) {
    if (Array.isArray(traceDataOrArray)) {
      for (const traceCfg of traceDataOrArray) {
        this.addTrace(traceCfg);
      }
      return null;
    }

    
    const { path, node, varNode, staticTraceData, inputTraces, meta } = traceDataOrArray;

    const isBinding = TraceType.is.Declaration(staticTraceData?.type);

    const { state } = this.node;
    const { scope } = path;
    const inProgramStaticTraceId = state.traces.addTrace(path, staticTraceData);
    const tidIdentifier = scope.generateUidIdentifier(`t${inProgramStaticTraceId}_`);
    let bindingTidIdentifier;
    if (isBinding) {
      bindingTidIdentifier = tidIdentifier;
    }
    else {
      bindingTidIdentifier = varNode?.getBindingTidIdentifier();
    }

    const traceData = {
      path,
      node,
      inProgramStaticTraceId,
      tidIdentifier,
      bindingTidIdentifier,
      inputTraces,
      meta
    };
    this.traces.push(traceData);
    if (!isBinding) {
      // NOTE: node can have multiple traces (e.g. VariableDeclarator.id has binding and write nodes)
      node._setTraceData(traceData);
    }

    this.Verbose >= 2 && this.debug('[traceId]', tidIdentifier.name, `([${inputTraces?.map(tid => tid.name).join(',') || ''}])`, `@"${this}"`);

    return traceData;
  }

  // ###########################################################################
  // addTraceWithInputs
  // ###########################################################################

  addTraceWithInputs(traceData, inputPaths) {
    // also trace inputTraces if they are `Literal` or `ReferencedIdentifier`
    traceData.inputTraces = this.addInputs(inputPaths);
    return this.addTrace(traceData);
  }

  // exit() {
  // }

  // ###########################################################################
  // instrumentTrace*
  // ###########################################################################

  instrumentTraceExpression = (traceCfg) => {
    const { node } = this;
    const { state } = node;
    // const { scope } = path;

    traceWrapExpression(getInstrumentPath(traceCfg), state, traceCfg);
  }

  instrumentTraceDeclaration = (traceCfg) => {
    const { node } = this;
    const { state } = node;

    traceDeclaration(getInstrumentPath(traceCfg), state, traceCfg);
  }

  instrumentTraceWrite = (traceCfg) => {
    const { node } = this;
    const { state } = node;

    traceWrapWrite(getInstrumentPath(traceCfg), state, traceCfg);
  }

  // ###########################################################################
  // instrument
  // ###########################################################################

  instrument() {
    const { traces, node } = this;
    const { path } = node;
    const { scope } = path;

    // this.debug(`traces`, traces.map(t => t.tidIdentifier));
    for (const traceCfg of traces) {
      // add variable to scope
      const {
        /* inProgramStaticTraceId, */
        tidIdentifier,
        meta: {
          isNested = false,
          instrument = this.instrumentTraceExpression
        } = EmptyObject
      } = traceCfg;
      scope.push({
        id: tidIdentifier
      });

      if (!isNested) {
        instrument(traceCfg);
      }
    }
  }
}