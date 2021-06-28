import * as t from '@babel/types';
import isFunction from 'lodash/isFunction';
import { buildTraceCall, bindTemplate, bindExpressionTemplate } from './templateUtil';
import { addMoreTraceCallArgs, getDeclarationTid, getTraceCall, makeInputs } from './buildUtil';
import { applyPreconditionToExpression, getInstrumentTargetAstNode } from './common';
import { convertNonComputedPropToStringLiteral } from './objects';
import { buildTraceId } from './traceId';

const Verbose = 2;

// ###########################################################################
// traceExpression
// ###########################################################################

/**
 * 
 */
export const buildTraceExpressionVar = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%declarationTid%%)',
  function buildTraceExpressionVar(state, traceCfg) {
    const trace = getTraceCall(state, traceCfg, 'traceExpressionVar');
    const tid = buildTraceId(state, traceCfg);
    const declarationTid = getDeclarationTid(traceCfg);

    return {
      trace,
      expr: getInstrumentTargetAstNode(state, traceCfg),
      tid,
      declarationTid
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
    const expr = getInstrumentTargetAstNode(state, traceCfg);
    const tid = buildTraceId(state, traceCfg);

    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, pathToString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      trace,
      expr,
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
      expr: getInstrumentTargetAstNode(state, traceCfg),
      tid
    };
  }
);

// ###########################################################################
// traceDeclaration
// ###########################################################################

export function buildTraceDeclarationVar(state, traceCfg, value) {
  const { tidIdentifier, inProgramStaticTraceId } = traceCfg;
  const trace = getTraceCall(state, traceCfg, 'traceDeclaration');
  const args = [t.numericLiteral(inProgramStaticTraceId)];
  value && args.push(value);
  addMoreTraceCallArgs(args, traceCfg);

  return t.variableDeclarator(
    tidIdentifier,
    applyPreconditionToExpression(traceCfg, t.callExpression(trace, args))
  );
}

export function buildTraceDeclarations(state, traceCfgs) {
  const decls = traceCfgs.map((traceCfg) => {
    let valueNode = traceCfg.data?.valueNode;
    if (isFunction(valueNode)) {
      valueNode = valueNode(state, traceCfg);
    }
    return buildTraceDeclarationVar(state, traceCfg, valueNode);
  });
  return t.variableDeclaration('var', decls);
}

// ###########################################################################
// traceWriteVar
// ###########################################################################

export const buildTraceWriteVar = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%declarationTid%%, %%inputs%%)',
  function buildTraceWriteVar(state, traceCfg) {
    const trace = getTraceCall(state, traceCfg, 'traceWriteVar');
    const tid = buildTraceId(state, traceCfg);
    const declarationTid = getDeclarationTid(traceCfg);

    return {
      trace,
      expr: getInstrumentTargetAstNode(state, traceCfg),
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
// traceExpressionME
// ###########################################################################

function getMEObjectNode(meNode, traceCfg) {
  return traceCfg.data.objectAstNode || meNode.object;
}

function getMEPropertyNode(meNode, traceCfg) {
  return traceCfg.data.propertyAstNode ||
    convertNonComputedPropToStringLiteral(meNode.property, meNode.computed);
}

export const buildtraceExpressionME = bindExpressionTemplate(
  '%%tme%%(%%objValue%%, %%propValue%%, %%tid%%, %%objectTid%%)',
  function buildtraceExpressionME(state, traceCfg) {
    // const { scope } = path;
    const meNode = getInstrumentTargetAstNode(state, traceCfg);
    const trace = getTraceCall(state, traceCfg, 'traceExpressionME');
    const tid = buildTraceId(state, traceCfg);
    const { objectTid } = traceCfg.data;
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
      propValue: getMEPropertyNode(meNode, traceCfg),
      tid,
      objectTid
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
  '%%trace%%(%%objValue%%, %%propValue%%, %%value%%, %%tid%%, %%objectTid%%, %%inputs%%)',
  function buildTraceWriteME(state, traceCfg) {
    const { ids: { aliases: {
      traceWriteME: trace
    } } } = state;
    const tid = buildTraceId(state, traceCfg);

    const assignmentExpression = getInstrumentTargetAstNode(state, traceCfg);
    const {
      left: meNode,
      right: rVal,
      operator
    } = assignmentExpression;

    const {
      object: objectNode,
      property: propertyNode
    } = meNode;

    const {
      data: {
        objectTid,
        objectAstNode: objectVar,
        propertyAstNode: propertyVar
      }
    } = traceCfg;

    const o = objectVar ? t.assignmentExpression('=', objectVar, objectNode) : objectNode;
    const p = t.assignmentExpression('=', propertyVar, convertNonComputedPropToStringLiteral(propertyNode, meNode.computed));
    const lVal = t.memberExpression(objectVar || objectNode, propertyVar, true, false);
    const value = t.assignmentExpression(operator, lVal, rVal);

    return {
      trace,
      objValue: o,
      propValue: p,
      value,
      tid,
      objectTid,
      inputs: makeInputs(traceCfg)
    };
  }
);

// ###########################################################################
// buildTraceDeleteME
// ###########################################################################

export const buildTraceDeleteME = buildTraceCall(
  '%%trace%%(%%objValue%%, %%propValue%%, %%tid%%, %%objectTid%%, %%inputs%%)',
  function buildTraceDeleteME(state, traceCfg) {
    const { ids: { aliases: {
      traceDeleteME: trace
    } } } = state;
    const tid = buildTraceId(state, traceCfg);

    const unaryExpression = getInstrumentTargetAstNode(state, traceCfg);
    const {
      argument: meNode
    } = unaryExpression;

    const {
      object: objectNode,
      property: propertyNode
    } = meNode;

    const {
      data: {
        objectTid,
        objectAstNode: objectVar,
        propertyAstNode: propertyVar
      }
    } = traceCfg;

    const o = t.assignmentExpression('=', objectVar, objectNode);
    const p = t.assignmentExpression('=', propertyVar, convertNonComputedPropToStringLiteral(propertyNode, meNode.computed));

    return {
      trace,
      objValue: o,
      propValue: p,
      tid,
      objectTid,
      inputs: makeInputs(traceCfg)
    };
  }
);