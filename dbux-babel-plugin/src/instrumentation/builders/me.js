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
export const buildtraceExpressionME = bindExpressionTemplate(
  '%%tme%%(%%object%%, %%property%%, %%value%%, %%tid%%, %%objectTid%%)',
  function buildtraceExpressionME(state, traceCfg) {
    // const { scope } = path;
    const meNode = getInstrumentTargetAstNode(state, traceCfg);
    const trace = getTraceCall(state, traceCfg, 'traceExpressionME');
    const tid = buildTraceId(state, traceCfg);

    const {
      object: objectNode,
      property: propertyNode,
      computed,
      optional
    } = meNode;

    const {
      data: {
        objectTid,
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

    // build actual MemberExpression
    const newMemberExpression = (optional ? t.optionalMemberExpression : t.memberExpression)(
      objectVar,
      propertyVar || propertyNode,
      computed, false
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


// ###########################################################################
// buildTraceWriteClassProperty
// ###########################################################################

const writeMETemplate = template('%%trace%%(%%object%%, %%property%%, %%value%%, %%tid%%, %%objectTid%%, %%inputs%%)');

/**
 * [ME]
 *  
 * @example
 * In: `prop = g()`
 * Out: `prop = twme(te(this...), 'prop', te(g()...)...)`
 *
 * @example
 * In: `[f()] = g()`
 * Out: `[p = te(f()...)] = twme(te(this...), p, te(g()...)...)`
 *
 * @example
 * In: `#a = g()`
 * Out: `#a = twme(te(this...), '#a', te(g()...)...)`
 * 
 * Assignment is equivalent to `defineProperty` the way that babel does it - consider:
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty#adding_properties_and_default_values
 */
export function buildTraceWriteClassProperty(state, traceCfg) {
  const { ids: { aliases: {
    traceWriteME: trace
  } } } = state;
  const tid = buildTraceId(state, traceCfg);

  const classProperty = getInstrumentTargetAstNode(state, traceCfg);
  let {
    key: keyNode,
    value: valueNode,
    computed
  } = classProperty;

  const {
    data: {
      objectTid,
      thisTraceCfg,
      propertyAstNode: propertyVar // NOTE: this is `undefined`, if `!computed`
    }
  } = traceCfg;

  const thisNode = buildTraceExpression(state, thisTraceCfg);

  const o = thisNode;
  const p = convertNonComputedPropToStringLiteral(keyNode, computed);

  // fix `key`, if `computed`
  if (computed) {
    keyNode = t.assignmentExpression('=',
      propertyVar,
      p
    );
  }

  // build `value`
  valueNode = writeMETemplate({
    trace,
    object: o,
    property: propertyVar || p,
    value: valueNode,
    tid,
    objectTid,
    inputs: makeInputs(traceCfg)
  });

  // build final result
  const resultNode = t.cloneNode(classProperty, false, true); // shallow copy
  resultNode.computed = computed;
  resultNode.key = keyNode;
  resultNode.value = valueNode;
  return resultNode;
}
