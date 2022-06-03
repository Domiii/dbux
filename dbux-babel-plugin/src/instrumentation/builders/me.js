import * as t from '@babel/types';
import template from '@babel/template';
import { buildTraceCall, bindExpressionTemplate } from './templateUtil';
import { getTraceCall, makeInputs } from './buildUtil';
import { getInstrumentTargetAstNode } from './common';
import { convertNonComputedPropToStringLiteral } from './objects';
import { buildTraceId } from './traceId';
import { buildTraceExpression } from './misc';


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

/**
 * [ME]
 */

const buildtraceExpressionMEDefault = bindExpressionTemplate(
  '%%tme%%(%%object%%, %%property%%, %%value%%, %%tid%%, %%objectTid%%)',
  function buildtraceExpressionMEDefault(/* meNode, */ state, traceCfg) {
    const meNode = getInstrumentTargetAstNode(state, traceCfg);
    const trace = getTraceCall(state, traceCfg, 'traceExpressionME');
    const tid = buildTraceId(state, traceCfg);

    const {
      object: objectNode,
      property: propertyNode,
      computed
    } = meNode;

    const {
      data: {
        objectTid,
        isObjectTracedAlready,
        objectAstNode: objectVar,
        propertyAstNode: propertyVar, // NOTE: this is `undefined`, if `!computed`
        optional
      }
    } = traceCfg;

    // build object
    const o = isObjectTracedAlready ? objectVar : t.assignmentExpression('=', objectVar, objectNode);

    // build propertyValue
    let propertyValue = convertNonComputedPropToStringLiteral(propertyNode, computed);
    if (computed) {
      propertyValue = t.assignmentExpression('=',
        propertyVar,
        propertyValue
      );
    }

    // build actual MemberExpression
    const newMemberExpression = (optional ? t.optionalMemberExpression : t.memberExpression)(
      objectVar,
      propertyVar || propertyNode,
      computed,
      optional
    );

    return {
      tme: trace,
      object: o,
      property: propertyValue,
      value: newMemberExpression,
      tid,
      objectTid
    };
  }
);

/**
 * Rval ME.
 */
export function buildtraceExpressionME(state, traceCfg) {
  // const meNode = getInstrumentTargetAstNode(state, traceCfg);
  // if (meNode.optional) {

  // }
  return buildtraceExpressionMEDefault(state, traceCfg);
}


// ###########################################################################
// traceWriteME
// ###########################################################################

/**
 * [ME]
 * 
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
  '%%trace%%(%%object%%, %%property%%, %%value%%, %%tid%%, %%objectTid%%, %%inputs%%)',
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
      property: propertyNode,
      computed
    } = meNode;

    const {
      data: {
        objectTid,
        propertyTid,
        isObjectTracedAlready,
        objectAstNode: objectVar,
        propertyAstNode: propertyVar // NOTE: this is `undefined`, if `!computed`
      }
    } = traceCfg;

    // build object
    const o = isObjectTracedAlready ? objectVar : t.assignmentExpression('=', objectVar, objectNode);

    // build propertyValue
    let propertyValue = convertNonComputedPropToStringLiteral(propertyNode, computed);
    if (computed) {
      propertyValue = t.assignmentExpression('=',
        propertyVar,
        propertyValue
      );
    }

    // build value
    const newMemberExpression = t.memberExpression(
      objectVar,
      propertyVar || propertyNode,
      computed, false
    );
    const value = t.assignmentExpression(
      operator,
      newMemberExpression,
      rVal
    );

    return {
      trace,
      object: o,
      property: propertyValue,
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

/**
 * [ME]
 * 
 * @example
 * `delete o.x;`
 * 
 * NOTE: "Private fields can not be deleted"
 */
export const buildTraceDeleteME = buildTraceCall(
  '%%trace%%(%%object%%, %%property%%, %%tid%%, %%objectTid%%, %%inputs%%)',
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

    const o = t.assignmentExpression(
      '=',
      objectVar,
      objectNode
    );
    const p = t.assignmentExpression(
      '=',
      propertyVar,
      convertNonComputedPropToStringLiteral(propertyNode, meNode.computed)
    );

    return {
      trace,
      object: o,
      property: p,
      tid,
      objectTid,
      inputs: makeInputs(traceCfg)
    };
  }
);
