import * as t from '@babel/types';
import template from '@babel/template';
import { buildTraceCall, bindExpressionTemplate } from './templateUtil';
import { getTraceCall, makeInputs, NullNode, ZeroNode } from './buildUtil';
import { getInstrumentTargetAstNode } from './common';
import { convertNonComputedPropToStringLiteral } from './objects';
import { buildTraceId } from './traceId';
import { buildTraceExpression } from './misc';


// ###########################################################################
// traceExpressionME
// ###########################################################################

/**
 * [ME]
 */

const buildtraceExpressionMEDefault = bindExpressionTemplate(
  '%%tme%%(%%object%%, %%property%%, %%value%%, %%tid%%, %%objectTid%%)',
  function buildtraceExpressionMEDefault(/* meNode, */ state, traceCfg) {
    const meAstNode = getInstrumentTargetAstNode(state, traceCfg);
    const trace = getTraceCall(state, traceCfg, 'traceExpressionME');
    const tid = buildTraceId(state, traceCfg);

    const {
      object: objectAstNode,
      property: propertyAstNode,
      computed
    } = meAstNode;

    const {
      data: {
        objectTid,
        objectVar,
        propertyVar, // NOTE: this is `undefined`, if `!computed`
        optional
      }
    } = traceCfg;

    // build object

    const o = buildMEObject(meAstNode, traceCfg);

    // build propertyValue
    let propValue = convertNonComputedPropToStringLiteral(propertyAstNode, computed);
    if (computed) {
      propValue = t.assignmentExpression('=',
        propertyVar,
        propValue
      );
    }

    let newO = objectVar || objectAstNode;
    if (objectAstNode.type === 'Super') {
      // hackfix: super
      // don't replace `super` in `super.f()` (but do trace `this` instead of `super`)
      newO = objectAstNode;
    }

    // build actual MemberExpression
    const newMemberExpression = (optional ? t.optionalMemberExpression : t.memberExpression)(
      newO,
      propertyVar || propertyAstNode,
      computed,
      optional
    );

    return {
      tme: trace,
      object: o,
      property: propValue,
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
  '%%trace%%(%%object%%, %%objectTid%%, %%propValue%%, %%propTid%%, %%value%%, %%tid%%, %%inputs%%)',
  function buildTraceWriteME(state, traceCfg) {
    const { ids: { aliases: {
      traceWriteME: trace
    } } } = state;
    const tid = buildTraceId(state, traceCfg);

    const assignmentExpression = getInstrumentTargetAstNode(state, traceCfg);
    const {
      left: meAstNode,
      right: rvalAstNode,
      operator
    } = assignmentExpression;

    const {
      data: {
        objectTid,
        propTid
      }
    } = traceCfg;

    // build object
    const o = buildMEObject(meAstNode, traceCfg);

    // build propValue
    let propValue = buildMEProp(meAstNode, traceCfg);

    // build lval
    // NOTE: buildMELval does uses `propVar`. We could have also used `propValue`, and then passed `propVar` to trace call.
    const newLvalNode = buildMELval(meAstNode, traceCfg);

    // build final assignment
    const newMENode = t.assignmentExpression(
      operator,
      newLvalNode,
      rvalAstNode
    );

    // console.debug(`[Dbux Instrument][TWME] tid=${tid.name} propValue=${propValue}`);

    return {
      trace,
      object: o,
      propValue,
      propTid,
      objectTid,
      value: newMENode,
      tid,
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
        objectVar,
        propertyVar
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


/** ###########################################################################
 * ME utils
 * ##########################################################################*/

/**
 * @param {AstNode} meAstNode 
 * @param {TraceCfg} traceCfg 
 */
export function buildMEObject(meAstNode, traceCfg) {
  const {
    data: {
      dontTraceObject,
      objectVar
    }
  } = traceCfg;

  const {
    object: objectAstNode,
  } = meAstNode;

  if (dontTraceObject) {
    return objectVar || NullNode;
  }


  return t.assignmentExpression('=', objectVar, objectAstNode);
}

/**
 * @param {AstNode} meAstNode 
 * @param {TraceCfg} traceCfg 
 */
export function buildMEProp(meAstNode, traceCfg) {
  const {
    property: propertyNode,
    computed
  } = meAstNode;
  const {
    data: {
      propertyVar // NOTE: this is `undefined`, if `!computed`
    }
  } = traceCfg;

  let propValue = convertNonComputedPropToStringLiteral(propertyNode, computed);
  if (computed) {
    // store in var because we need `propValue` in multiple places
    propValue = t.assignmentExpression('=',
      propertyVar,
      propValue
    );
  }
  return propValue;
}

/**
 * 
 * @param {AstNode} meAstNode 
 * @param {*} traceCfg 
 */
export function getMEpropVal(meAstNode, traceCfg) {
  const {
    property: propertyNode,
    computed
  } = meAstNode;
  const {
    data: {
      propertyVar // NOTE: this is `undefined`, if `!computed`
    }
  } = traceCfg;

  return propertyVar || convertNonComputedPropToStringLiteral(propertyNode, computed);
}

/**
 * @param {AstNode} meAstNode 
 * @param {TraceCfg} traceCfg 
 */
export function buildMELval(meAstNode, traceCfg) {
  const {
    object: objectAstNode,
    property: propertyAstNode,
    computed
  } = meAstNode;

  const {
    data: {
      objectVar,
      propertyVar
    }
  } = traceCfg;

  const obj = objectVar || objectAstNode;
  const prop = propertyVar || propertyAstNode;

  return t.memberExpression(
    obj,
    prop,
    computed,
    false
  );
}

