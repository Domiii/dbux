import { NodePath } from '@babel/traverse';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { getPresentableString } from '../../helpers/pathHelpers';
import { traceWrapExpression, traceWrapWrite } from '../../instrumentation/trace';
import ParseNode from '../../parseLib/ParseNode';
// import { getPresentableString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';

const makeInputTrace = {
  Literal(path) {
    return {
      node: null,
      path,
      varNode: null,
      staticTraceData: {
        type: TraceType.ExpressionValue,
        dataNode: {
          // TODO: `isNew` for literals is only `true` the first time. Need dynamic `isNew` to mirror this.
          isNew: true,
          type: DataNodeType.Read
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

  addTrace(traceDataOrArray) {
    if (Array.isArray(traceDataOrArray)) {
      for (const traceCfg of traceDataOrArray) {
        this.addTrace(traceCfg);
      }
      return null;
    }

    const { path, node, varNode, staticTraceData, inputTidIds, meta } = traceDataOrArray;

    const { state } = this.node;
    const { scope } = path;
    const inProgramStaticTraceId = state.traces.addTrace(path, staticTraceData);
    const tidIdentifier = scope.generateUidIdentifier(`t${inProgramStaticTraceId}_`);

    const traceData = {
      path,
      node,
      inProgramStaticTraceId,
      tidIdentifier,
      bindingTidIdentifier: varNode?.getBindingTidIdentifier(),
      inputTidIds,
      meta
    };
    this.traces.push(traceData);
    if (node) {
      // TODO: in case of non-Node, might want to attach to `path` instead
      node._setTraceData(traceData);
    }

    this.Verbose >= 2 && this.debug('[traceId]', tidIdentifier.name, `([${inputTidIds?.map(tid => tid.name).join(',') || ''}])`, `@"${this}"`);

    return traceData;
  }

  // ###########################################################################
  // 
  // ###########################################################################

  addWriteTrace(writeTraceData, rvalPath) {
    if (rvalPath.node) {
      const inputTrace = this.addInputs(rvalPath);
      writeTraceData.meta = writeTraceData.meta || {};

      // TODO: generalize from `expressionTraceCfg` to `nestedTraceCfgs`

      writeTraceData.meta.expressionTraceCfg = inputTrace;
    }

    return this.addTrace(writeTraceData);
  }

  // ###########################################################################
  // addTraceWithInputs
  // ###########################################################################

  addTraceWithInputs(traceCfg, inputPaths) {
    // also trace inputTidIds if they are `Literal` or `ReferencedIdentifier`
    const inputTidIds = this.addInputs(inputPaths);

    // this.warn(`[${this.node.name}] traceData`, tidIdentifier.name);

    traceCfg.inputTidIds = inputTidIds;
    return this.addTrace(traceCfg);
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

    const {
      path: tracePath,
      meta: {
        replacePath
      } = EmptyObject
    } = traceCfg;

    traceWrapExpression(replacePath || tracePath, state, traceCfg);
  }

  instrumentTraceWrite(writeTraceCfg) {
    const { node } = this;
    const { state } = node;

    const {
      path: tracePath,
      meta: {
        replacePath
      } = EmptyObject
    } = writeTraceCfg;

    traceWrapWrite(replacePath || tracePath, state, writeTraceCfg, expressionTraceCfg);
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