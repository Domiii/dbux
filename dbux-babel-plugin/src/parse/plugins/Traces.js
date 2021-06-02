// import { NodePath } from '@babel/traverse';
// import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
// import TraceType from '@dbux/common/src/core/constants/TraceType';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { getPresentableString } from '../../helpers/pathHelpers';
import { traceWrapExpression, traceWrapWrite, traceDeclarations, traceNoValue } from '../../instrumentation/trace';
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
      // NOTE: this (roughly) translates to `node.getDeclarationNode()._traceCfg.tidIdentifier`
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
      node?._setTraceData(traceData);
      this.traces.push(traceData);
    }

    this.Verbose >= 2 && this.debug('[traceId]', tidIdentifier.name, `([${inputTraces?.map(tid => tid.name).join(',') || ''}])`, `@"${this.node}"`);

    return traceData;
  }

  // ###########################################################################
  // addDeclarationTrace
  // ###########################################################################

  /**
   * @param {BindingIdentifier} id
   */
  addDeclarationTrace(id) {
    const traceCfg = this.addTrace({
      path: id.path,
      node: id,
      staticTraceData: {
        type: TraceType.Declaration,
        dataNode: {
          // NOTE: declaration trace is always hoisted to some scope, always assigned a "new" `undefined` value (until assignment/definition happens)
          isNew: true
        }
      },
      meta: {
        instrument: this.node.Traces.instrumentTraceDeclaration
      }
    });
    this.declarationTraces.push(traceCfg);

    this.Verbose && this.debug(`DECL ${traceCfg.tidIdentifier.name} to ${this.node}`);

    return traceCfg;
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
    const { state } = this.node;

    traceWrapExpression(getInstrumentPath(traceCfg), state, traceCfg);
  }

  instrumentTraceNoValue = (traceCfg) => {
    const { state } = this.node;

    traceNoValue(getInstrumentPath(traceCfg), state, traceCfg);
  }

  instrumentCallExpression = traceCfg => {
    const { path } = traceCfg;
    this.instrumentTraceExpression(traceCfg);

    const bcePath = path.get();
    this.instrumentBCE();
  }

  instrumentTraceDeclarations = (traceCfgs) => {
    const { node } = this;
    const { state } = node;

    if (traceCfgs.length) {
      traceDeclarations(node.path, state, traceCfgs);
    }
  }

  // ###########################################################################
  // instrument
  // ###########################################################################

  instrument() {
    const { node, traces, declarationTraces } = this;
    const { path } = node;
    const { scope } = path;

    // this.debug(`traces`, traces.map(t => t.tidIdentifier));
    this.instrumentTraceDeclarations(declarationTraces);

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