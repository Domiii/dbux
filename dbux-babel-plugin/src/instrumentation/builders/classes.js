import * as t from '@babel/types';
import template from '@babel/template';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { makeInputs } from './buildUtil';
import { getInstrumentTargetAstNode } from './common';
import { convertNonComputedPropToStringLiteral } from './objects';
import { buildTraceId } from './traceId';
import { buildTraceExpression, buildTraceExpressionNoInput } from './misc';
import { postInstrument } from '../instrumentMisc';
import { findSuperCallPath } from '../../visitors/superVisitor';

// ###########################################################################
// instrumentClass
// ###########################################################################

/**
 * 
 */
function instrumentClassDefault(state, traceCfg) {
  injectTraceClass(state, traceCfg);
  injectTraceInstance(state, traceCfg);
}

// ###########################################################################
// instrumentClassExpression
// ###########################################################################

export function instrumentClassExpression(state, traceCfg) {
  const { path } = traceCfg;
  const classVar = path.node.id || path.scope.generateDeclaredUidIdentifier('class');

  instrumentClassDefault(state, traceCfg);
  const postClassNodes = buildPostClassNodes(classVar, state);

  // wrap ClassExpression, with postNodes afterwards
  const resultNode = t.sequenceExpression(
    t.assignmentExpression('=', classVar, path.node),
    ...postClassNodes
  );

  path.replaceWith(resultNode);
  postInstrument(traceCfg, resultNode);
}


// ###########################################################################
// instrumentClassDeclaration
// ###########################################################################

export function instrumentClassDeclaration(state, traceCfg) {
  const { path } = traceCfg;
  const classVar = path.node.id;

  instrumentClassDefault(state, traceCfg);

  // insert post nodes
  const postClassNodes = buildPostClassNodes(classVar, state);
  path.insertAfter(t.expressionStatement(
    t.sequenceExpression(postClassNodes)
  ));

  postInstrument(traceCfg, path.node);
}

// ###########################################################################
// injectTraceClass
// ###########################################################################

function injectTraceClass(state, traceCfg) {
  const {
    path
  } = traceCfg;

  const {
    ids: {
      dbuxClass
    }
  } = state;

  const bodyPath = path.get('body');

  const traceClassCall = TODO;
  bodyPath.unshiftContainer('body', t.classProperty(
    dbuxClass,
    t.functionExpression(null, [],
      t.blockStatement(
        traceClassCall,
      )
    ),
    t.noop(),
    EmptyArray,
    false,
    true
  ));
}

// ###########################################################################
// injectTraceInstance
// ###########################################################################

function injectTraceInstance(state, traceCfg) {
  const { ids: { dbuxInstance } } = state;
  const {
    path,
    data: {
      traceInstanceTraceCfg
    }
  } = traceCfg;

  // inject __dbux_instance iife property
  const traceInstanceCall = build(state, traceInstanceTraceCfg);
  const traceInstanceProperty = t.classPrivateProperty(
    dbuxInstance,
    t.callExpression(
      t.functionExpression(null, [],
        t.blockStatement(
          traceInstanceCall,
        )
      ),
      EmptyArray
    )
  );
  path.unshiftContainer('body', traceInstanceProperty);

  // delete __dbux_instance property after ctor
  let constructor = TODO;
  let superPath;
  if (!constructor) {
    constructor = createConstructor;
    addSuperIfHasSuperClass(constructor);
  }
  else {
    superPath = findSuperCallPath(constructor);
  }

  if (!superPath) {
    constructor.unshiftContainer('body', traceInstanceCall);
  }
  else {
    superPath.insertAfter(traceInstanceCall);
  }
}

// ###########################################################################
// buildPostClassNodes
// ###########################################################################

/**
 * Returns `[CLASS.__dbux_class(), delete CLASS.__dbux_class]`
 */
function buildPostClassNodes(classVar, state) {
  const {
    ids: {
      dbuxClass
    }
  } = state;

  const dbuxClassMe = t.memberExpression(
    classVar,
    dbuxClass
  );

  return [
    t.callExpression(
      dbuxClassMe,
      EmptyArray
    ),
    t.unaryExpression(
      'delete',
      dbuxClassMe
    )
  ];
}



// ###########################################################################
// buildTraceWriteClassProperty
// ###########################################################################

const writePropertyTemplate = template(
  '%%trace%%(%%object%%, %%property%%, %%value%%, %%tid%%, %%objectTid%%, %%inputs%%)'
);

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
  valueNode = writePropertyTemplate({
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
