// import template from '@babel/template';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import { getPresentableString } from '../../helpers/pathHelpers';
import { bindExpressionTemplate, bindTemplate } from '../../helpers/templateUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/trace');

const Verbose = 2;

export const ZeroNode = t.numericLiteral(0);
export const NullNode = t.nullLiteral();
export const UndefinedNode = t.identifier('undefined');

export const buildTraceId = bindExpressionTemplate(
  '(%%traceId%% = %%newTraceId%%(%%staticTraceId%%))',
  function buildTraceId(state, { tidIdentifier, inProgramStaticTraceId }) {
    // TODO: add custom trace data
    const { ids: { aliases: {
      newTraceId
    } } } = state;

    return {
      newTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId),
      traceId: tidIdentifier
    };
  }
);

/**
 * 
 */
export const buildTraceExpression = bindExpressionTemplate(
  '%%traceExpression%%(%%expr%%, %%tid%%, %%bindingTid%%, %%inputs%%)',
  function buildTraceExpression(expressionNode, state, traceCfg) {
    // const { scope } = path;
    const { ids: { aliases: {
      traceExpression
    } } } = state;


    const {
      bindingTidNode,
      inputTraces
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);
    Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, getPresentableString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      traceExpression,
      expr: expressionNode,
      tid,
      bindingTid: bindingTidNode || ZeroNode,
      inputs: inputTraces && t.arrayExpression(inputTraces.map(i => i.tidIdentifier)) || NullNode
    };
  }
);

// TODO: deferTid?
export const buildTraceWrite = bindExpressionTemplate(
  '%%traceWrite%%(%%expr%%, %%tid%%, %%inputs%%)',
  function buildTraceWrite(expr, state, traceCfg) {
    const { ids: { aliases: {
      traceBind
    } } } = state;

    const {
      inputTidIds
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);

    return {
      expr,
      traceBind,
      tid,
      inputs: inputTidIds && t.arrayExpression(inputTidIds) || NullNode
    };
  }
);

// export const buildTraceWrite = bindExpressionTemplate(
//   // TODO: value, tid, deferTid, ...inputs
//   '%%traceWrite%%(%%tid%%, %%bindingTid%%, %%deferTid%%, %%inputs%%)',
//   function buildTraceWrite(state, traceCfg) {
//     const { ids: { aliases: {
//       traceWrite
//     } } } = state;

//     const {
//       bindingTidNode,
//       inputTidIds
//     } = traceCfg;

//     const tid = buildTraceId(state, traceCfg);
//     // Verbose && debug('[tw]', getPresentableString(path));

//     // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

//     // TODO: keep `path` data etc, if necessary - `onCopy(path, newPath);`

//     return {
//       traceWrite,
//       tid,
//       bindingTid: bindingTidNode || ZeroNode,
//       deferTid: NullNode,
//       inputs: inputTidIds && t.arrayExpression(inputTidIds) || NullNode
//     };
//   }
// );


/**
 * TODO: rewrite using `traceCfg`
 */
export const buildTraceNoValue = bindTemplate(
  '%%dbux%%.t(%%traceId%%)',
  function buildTraceNoValue(path, state, staticTraceData) {
    const { ids: { dbux } } = state;
    const traceId = state.traces.addTrace(path, staticTraceData);
    // console.warn(`traces`, state.traces);
    return {
      dbux,
      traceId: t.numericLiteral(traceId)
    };
  }
);

