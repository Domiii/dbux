// import { NodePath } from '@babel/traverse';
// import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
// import TraceType from '@dbux/common/src/core/constants/TraceType';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { getPresentableString } from '../../helpers/pathHelpers';
import { traceWrapExpression, traceWrapWrite, traceDeclarations } from '../../instrumentation/trace';
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
  declarationTraces = [];

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

  addDeclarationTrace(traceData) {
    const traceCfg = this.addTrace(traceData);
    this.declarationTraces.push(traceCfg);
    return traceCfg;
  }

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


    const {
      path,
      node,
      staticTraceData,
      meta,
      inputTraces
    } = traceDataOrArray;

    if (!path || !staticTraceData) {
      throw new Error(`addTrace data missing \`path\` or \`staticTraceData\``);
    }

    const isDeclaration = TraceType.is.Declaration(staticTraceData.type);

    // set default static DataNode
    staticTraceData.dataNode = staticTraceData.dataNode || { isNew: false };

    const { state } = this.node;
    const { scope } = path;
    const inProgramStaticTraceId = state.traces.addTrace(path, staticTraceData);
    const tidIdentifier = scope.generateUidIdentifier(`t${inProgramStaticTraceId}_`);

    let declarationTidIdentifier;
    if (isDeclaration) {
      declarationTidIdentifier = tidIdentifier;
    }
    else {
      declarationTidIdentifier = node?.getDeclarationTidIdentifier();
    }

    const traceData = {
      path,
      node,
      inProgramStaticTraceId,
      tidIdentifier,
      declarationTidIdentifier,
      inputTraces,
      meta
    };

    if (!isDeclaration) {
      node._setTraceData(traceData);
      this.traces.push(traceData);
    }

    this.Verbose >= 2 && this.debug('[traceId]', tidIdentifier.name, `([${inputTraces?.map(tid => tid.name).join(',') || ''}])`, `@"${this.node}"`);

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

    traceWrapExpression(getInstrumentPath(traceCfg), state, traceCfg);
  }

  instrumentTraceDeclaration = (traceCfg) => {
    const { node } = this;
    const { state } = node;

    traceDeclarations(getInstrumentPath(traceCfg), state, traceCfg);
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
          instrument = this.instrumentTraceExpression
        } = EmptyObject
      } = traceCfg;
      instrument(traceCfg);
    }

    for (const traceCfg of traces) {
      // add variable to scope
      const {
        /* inProgramStaticTraceId, */
        tidIdentifier,
        meta: {
          instrument = this.instrumentTraceExpression
        } = EmptyObject
      } = traceCfg;
      scope.push({
        id: tidIdentifier
      });

      instrument(traceCfg);
    }
  }
}