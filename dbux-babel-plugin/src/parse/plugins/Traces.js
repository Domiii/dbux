// import { NodePath } from '@babel/traverse';
// import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
// import TraceType from '@dbux/common/src/core/constants/TraceType';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import TraceCfg from '../../definitions/TraceCfg';
import { pathToString } from '../../helpers/pathHelpers';
import { traceWrapExpression, traceDeclarations } from '../../instrumentation/trace';
import ParseNode from '../../parseLib/ParseNode';
// import { pathToString } from '../../helpers/pathHelpers';
import ParsePlugin from '../../parseLib/ParsePlugin';

const makeDefaultTrace = {
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

  addDefaultTrace = (path) => {
    const node = this.node.getNodeOfPath(path);
    if (!node) {
      // handle some (basic) default AST node types
      const traceData = makeDefaultTrace[path.node.type]?.(path);
      if (!traceData) {
        this.node.logger.warn(`Found unknown AST node type "${path.node.type}" for input node: ${pathToString(path)}`);
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
        const rawTraceData = node.createDefaultTrace?.();
        if (!rawTraceData) {
          this.node.logger.warn(`ParseNode did not implement "createDefaultTrace": ${node}`);
          return null;
        }
        this.addTrace(rawTraceData);
      }
      return node._traceCfg;
    }
  }

  /**
   * NOTE: we assume inputs to be RVals.
   */
  addInputs(inputPaths) {
    return inputPaths.flat()
      .map(this.addDefaultTrace)
      .filter(node => !!node);
  }

  // ###########################################################################
  // addTrace
  // ###########################################################################

  /**
   * @return {TraceCfg}
   */
  addTrace(traceData) {
    if (Array.isArray(traceData)) {
      for (const t of traceData) {
        this.addTrace(t);
      }
      return null;
    }


    const {
      path,
      node,
      staticTraceData,
      inputTraces,
      meta,
      data
    } = traceData;

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

    const traceCfg = {
      path,
      node,
      inProgramStaticTraceId,
      tidIdentifier,
      declarationTidIdentifier,
      inputTraces,
      meta,
      data
    };

    if (!isDeclaration) {
      node?._setTraceData(traceCfg);
      this.traces.push(traceCfg);
    }

    this.Verbose >= 2 && this.debug('[traceId]', tidIdentifier.name, `([${inputTraces?.map(tid => tid.name).join(',') || ''}])`, `@"${this.node}"`);

    return traceCfg;
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
    // add trace for inputTraces if they don't have any yet
    // NOTE: especially for `Literal` or `ReferencedIdentifier`
    traceData.inputTraces = this.addInputs(inputPaths);

    return this.addTrace(traceData);
  }

  // exit() {
  // }

  // ###########################################################################
  // instrument
  // ###########################################################################

  instrumentTraceDeclarations = (traceCfgs) => {
    const { node } = this;
    const { state } = node;

    if (traceCfgs.length) {
      traceDeclarations(node.path, state, traceCfgs);
    }
  }

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
          instrument = traceWrapExpression
        } = EmptyObject
      } = traceCfg;
      scope.push({
        id: tidIdentifier
      });

      // instrument?.(traceCfg);
      const { state } = this.node;
      instrument?.(getInstrumentPath(traceCfg), state, traceCfg);
    }
  }
}