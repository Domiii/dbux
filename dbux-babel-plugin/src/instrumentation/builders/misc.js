// import template from '@babel/template';
import * as t from '@babel/types';
import { buildTraceCall, bindTemplate, bindExpressionTemplate } from '../../helpers/templateUtil';
import { getTraceCall, makeInputs, ZeroNode } from './buildHelpers';
import { getInstrumentTargetAstNode } from './common';
import { convertNonComputedPropToStringLiteral } from './objects';

const Verbose = 2;

// ###########################################################################
// newTraceId
// ###########################################################################

export const buildTraceId = bindExpressionTemplate(
  '%%traceId%% = %%newTraceId%%(%%staticTraceId%%)',
  function buildTraceId(state, { tidIdentifier, inProgramStaticTraceId }) {
    const { ids: { aliases: {
      newTraceId
    } } } = state;

    return {
      newTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId),
      traceId: tidIdentifier
    };
  },
);

/**
 * `newTraceId(staticTraceId, value)`
 * 
 * NOTE: Combines `newTraceId` with effect of `traceExpression` into one.
 * NOTE2: This is used if return value of expression is not used. Example: `registerParams`
 * NOTE3: this is different from `buildTraceDeclarations` when a `decl` has a `value`, since in that case, declaration and definition are separated.
 */
export const buildTraceIdValue = bindExpressionTemplate(
  '%%traceId%% = %%newTraceId%%(%%staticTraceId%%, %%value%%)',
  function buildTraceIdValue(state, { tidIdentifier, inProgramStaticTraceId }, value) {
    const { ids: { aliases: {
      newTraceId
    } } } = state;

    return {
      newTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId),
      traceId: tidIdentifier,
      value
    };
  },
);

// ###########################################################################
// traceExpression
// ###########################################################################

/**
 * 
 */
export const buildTraceExpressionVar = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%declarationTid%%, %%inputs%%)',
  function buildTraceExpressionVar(state, traceCfg) {
    const trace = getTraceCall(state, traceCfg, 'traceExpressionVar');
    const tid = buildTraceId(state, traceCfg);

    const {
      declarationTidIdentifier
    } = traceCfg;

    return {
      trace,
      expr: getInstrumentTargetAstNode(traceCfg),
      tid,
      declarationTid: declarationTidIdentifier || ZeroNode,
      inputs: makeInputs(traceCfg)
    };
  }
);
/**
 * 
 */
export const buildTraceExpression = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%inputs%%)',
  function buildTraceExpression(state, traceCfg) {
    const trace = getTraceCall(state, traceCfg);
    const tid = buildTraceId(state, traceCfg);

    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, pathToString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      trace,
      expr: getInstrumentTargetAstNode(traceCfg),
      tid,
      inputs: makeInputs(traceCfg)
    };
  }
);

/**
 * 
 */
export const buildTraceExpressionNoInput = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%)',
  function buildTraceExpressionNoInput(state, traceCfg) {
    const trace = getTraceCall(state, traceCfg);
    const tid = buildTraceId(state, traceCfg);

    return {
      trace,
      expr: getInstrumentTargetAstNode(traceCfg),
      tid
    };
  }
);

// ###########################################################################
// traceDeclaration
// ###########################################################################

export function buildTraceDeclaration(state, traceCfg, value) {
  const { tidIdentifier, inProgramStaticTraceId } = traceCfg;
  const trace = getTraceCall(state, traceCfg, 'traceDeclaration');
  const args = [t.numericLiteral(inProgramStaticTraceId)];
  value && args.push(value);

  return t.variableDeclarator(
    tidIdentifier,
    t.callExpression(trace, args)
  );
}

export function buildTraceDeclarations(state, traceCfgs) {
  const decls = traceCfgs.map((traceCfg) => {
    const valuePath = traceCfg.data?.valuePath;
    return buildTraceDeclaration(state, traceCfg, valuePath?.node);
  });
  return t.variableDeclaration('var', decls);
}

// ###########################################################################
// traceWriteVar
// ###########################################################################

export const buildTraceWriteVar = buildTraceCall(
  '%%traceWriteVar%%(%%expr%%, %%tid%%, %%declarationTid%%, %%inputs%%)',
  function buildTraceWriteVar(state, traceCfg) {
    const { ids: { aliases: {
      traceWriteVar
    } } } = state;

    const {
      declarationTidIdentifier
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);

    const declarationTid = declarationTidIdentifier || ZeroNode;

    return {
      expr: getInstrumentTargetAstNode(traceCfg),
      traceWriteVar,
      tid,
      declarationTid,
      inputs: makeInputs(traceCfg)
    };
  }
);

// ###########################################################################
// traceNoValue
// ###########################################################################

/**
 * TODO: rewrite using `traceCfg`
 * @deprecated
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

// ###########################################################################
// traceMemberExpression
// ###########################################################################

function getMEObjectNode(meNode, traceCfg) {
  return traceCfg.data.objectNode || meNode.object;
}

export const buildTraceMemberExpression = bindExpressionTemplate(
  '%%tme%%(%%objValue%%, %%propValue%%, %%tid%%, %%inputs%%)',
  function buildTraceMemberExpression(state, traceCfg) {
    // const { scope } = path;
    const meNode = getInstrumentTargetAstNode(traceCfg);
    const trace = getTraceCall(state, traceCfg, 'traceMemberExpression');
    const tid = buildTraceId(state, traceCfg);
    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, pathToString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      tme: trace,

      /**
       * NOTE: actual `object` node might have been moved; e.g. by `CalleeMemberExpression`
       */
      objValue: getMEObjectNode(meNode, traceCfg),

      /**
       * NOTE: we are getting the `prop` here (and not earlier), to make sure its the final instrumented version.
       */
      propValue: convertNonComputedPropToStringLiteral(meNode.property, meNode.computed),
      tid,
      inputs: makeInputs(traceCfg)
    };
  }
);


// ###########################################################################
// traceWriteME
// ###########################################################################

/**
 * NOTE: argument order enforces order of execution!
 * @example
 * ```js
 * function f(msg, value) { console.log(msg, value); return value; }
 * var o = {};
 * f(1, o)[f(2, 'prop')] = f(3, 'value')
 * o
 * ```
 */
export const buildTraceWriteME = buildTraceCall(
  '%%traceWriteME%%(%%objValue%%, %%propValue%%, %%rVal%%, %%tid%%, %%objTid%%, %%inputs%%)',
  function buildTraceWriteME(state, traceCfg) {
    const { ids: { aliases: {
      traceWriteME
    } } } = state;
    const tid = buildTraceId(state, traceCfg);

    const assignmentNode = getInstrumentTargetAstNode(traceCfg);
    const {
      left: meNode,
      right: rVal
    } = assignmentNode;

    const {
      data: {
        objTid
      }
    } = traceCfg;

    return {
      traceWriteME,
      objValue: getMEObjectNode(meNode, traceCfg),

      /**
       * NOTE: we are getting the `prop` in this method (and not earlier), to make sure its the final instrumented version.
       */
      propValue: convertNonComputedPropToStringLiteral(meNode),
      rVal,
      tid,
      objTid,
      inputs: makeInputs(traceCfg)
    };
  }
);