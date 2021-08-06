import * as t from '@babel/types';
import template from '@babel/template';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { makeInputs } from './buildUtil';
import { getInstrumentTargetAstNode } from './common';
import { convertNonComputedPropToStringLiteral } from './objects';
import { buildTraceId } from './traceId';
import { buildTraceExpressionNoInput } from './misc';
import { postInstrument } from '../instrumentMisc';
import { findConstructorMethod, findSuperCallPath } from '../../visitors/classUtil';

// ###########################################################################
// util
// ###########################################################################

const thisNode = t.thisExpression();

function buildMethodsArray(state, methodOwner, methods) {
  return t.arrayExpression(methods.map(({ trace }) => {
    const {
      path,
      data: {
        propertyVar
      }
    } = trace;
    const { computed } = path.node;
    // const key = convertNonComputedPropToStringLiteral(trace.path.node.key, computed);

    const key = propertyVar || convertNonComputedPropToStringLiteral(path.node.key, computed);
    const keyAccessor = propertyVar || path.node.key;
    return t.arrayExpression([
      key,

      // we add this because private methods cannot be accessed dynamically
      t.memberExpression(methodOwner, keyAccessor, computed),

      buildTraceId(state, trace)
    ]);
  }));
}

function buildPublicMethodArray(state, methods) {
  return t.arrayExpression(methods.map(({ trace }) => {
    const {
      path,
      data: {
        propertyVar
      }
    } = trace;
    const { computed } = path.node;
    // const key = convertNonComputedPropToStringLiteral(trace.path.node.key, computed);

    const key = propertyVar || convertNonComputedPropToStringLiteral(path.node.key, computed);
    return t.arrayExpression([
      key,
      buildTraceId(state, trace)
    ]);
  }));
}

function buildPrivateMethodArray(state, methodOwner, methods) {
  return t.arrayExpression(methods.map(({ trace }) => {
    const {
      path
    } = trace;

    const computed = false;
    const keyAccessor = path.node.key;
    return t.arrayExpression([
      // we add this because private methods cannot be accessed dynamically
      t.memberExpression(methodOwner, keyAccessor, computed),
      buildTraceId(state, trace)
    ]);
  }));
}

function buildDelete(obj, prop) {
  return t.expressionStatement(
    t.unaryExpression(
      'delete',
      t.memberExpression(
        obj,
        prop
      )
    )
  );
}

// ###########################################################################
// instrumentClass
// ###########################################################################

/**
 * 
 */
function instrumentClassDefault(classVar, state, traceCfg) {
  injectTraceClass(classVar, state, traceCfg);
  injectTraceInstance(state, traceCfg);

  const {
    data: {
      staticMethods,
      publicMethods
    }
  } = traceCfg;

  for (const { trace } of staticMethods) {
    instrumentMethodKey(state, trace);
  }
  for (const { trace } of publicMethods) {
    instrumentMethodKey(state, trace);
  }
}

// ###########################################################################
// instrumentClassExpression
// ###########################################################################

export function instrumentClassExpression(state, traceCfg) {
  const { path, data: { classVar } } = traceCfg;

  instrumentClassDefault(classVar, state, traceCfg);
  const postClassNodes = buildPostClassNodes(classVar, state);

  // wrap ClassExpression, with postNodes afterwards
  const expressions = [
    t.assignmentExpression('=', classVar, path.node),
    ...postClassNodes,
    classVar
  ];

  const resultNode = t.sequenceExpression(expressions);
  path.replaceWith(resultNode);
  postInstrument(traceCfg, resultNode);
}


// ###########################################################################
// instrumentClassDeclaration
// ###########################################################################

export function instrumentClassDeclaration(state, traceCfg) {
  const { path, data: { classVar } } = traceCfg;

  instrumentClassDefault(classVar, state, traceCfg);

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

function buildTraceClassCall(classVar, state, traceCfg) {
  const {
    data: {
      staticMethods,
      publicMethods
    }
  } = traceCfg;

  // TODO: fix buildMethodsArray(state, classVar, staticMethods)
  // TODO: trace static + public method computed properties

  const { ids: { aliases: { traceClass } } } = state;

  return t.expressionStatement(
    t.callExpression(traceClass, [
      classVar,
      buildTraceId(state, traceCfg),
      buildMethodsArray(state, classVar, staticMethods),
      buildPublicMethodArray(state, publicMethods)
    ])
  );
}


function injectTraceClass(classVar, state, traceCfg) {
  const {
    path
  } = traceCfg;

  const {
    ids: {
      dbuxClass
    }
  } = state;

  const bodyPath = path.get('body');

  // dbux.traceClass
  const traceClassCall = buildTraceClassCall(classVar, state, traceCfg);

  const isComputed = false;
  const isStatic = true;
  bodyPath.unshiftContainer('body', t.classProperty(
    dbuxClass,
    t.functionExpression(null, [],
      t.blockStatement([
        traceClassCall
      ])
    ),
    t.noop(),
    EmptyArray,
    isComputed,
    isStatic
  ));
}

// ###########################################################################
// injectTraceInstance
// ###########################################################################

function buildTraceInstanceExpression(state, instanceTraceCfg) {
  const {
    data: {
      privateMethods
    }
  } = instanceTraceCfg;

  const { ids: { aliases: { traceInstance } } } = state;

  return t.callExpression(traceInstance, [
    thisNode,
    buildTraceId(state, instanceTraceCfg),
    buildPrivateMethodArray(state, thisNode, privateMethods)
  ]);
}

function buildConstructor(classPath) {
  const params = EmptyArray;
  const body = [];

  // addSuperIfHasSuperClass
  const { superClass } = classPath.node;
  if (superClass) {
    // future-work: get rid of this combination of `spread` and `arguments`?
    const superArgs = [t.spreadElement(t.identifier('arguments'))];
    body.push(
      t.expressionStatement(
        t.callExpression(t.super(), superArgs)
      )
    );
  }

  // return new ctor
  return t.classMethod(
    'constructor',
    t.identifier('constructor'),
    params,
    t.blockStatement(body)
  );
}

function injectTraceInstance(state, traceCfg) {
  const { ids: { dbuxInstance, aliases: { traceInstance } } } = state;
  const {
    path: classPath,
    data: {
      instanceTraceCfg
    }
  } = traceCfg;

  // dbux.traceInstance
  const traceInstanceCall = buildTraceInstanceExpression(state, instanceTraceCfg);

  // inject __dbux_instance iife property
  const traceInstanceProperty = t.classProperty(
    dbuxInstance,
    t.callExpression(
      t.arrowFunctionExpression([], traceInstanceCall),
      EmptyArray
    )
  );
  classPath.get('body').unshiftContainer('body', traceInstanceProperty);

  // delete __dbux_instance property after ctor
  const traceInstanceCleanup = buildDelete(thisNode, dbuxInstance);
  let constructorPath = findConstructorMethod(classPath);
  let superCallPath;
  if (!constructorPath) {
    // inject new ctor
    const constructorNode = buildConstructor(classPath);
    classPath.get('body').unshiftContainer('body', constructorNode);
    constructorPath = findConstructorMethod(classPath);
  }
  superCallPath = findSuperCallPath(constructorPath);

  // insert `traceInstance` after `super` call, or at top of ctor
  if (superCallPath) {
    superCallPath.insertAfter(traceInstanceCleanup);
  }
  else {
    constructorPath.get('body').unshiftContainer('body', traceInstanceCleanup);
  }
}

// ###########################################################################
// buildPostClassNodes
// ###########################################################################

/**
 * 1. Call the utility property `__dbux_class` to trace the class *after* it has fully initialized.
 * 2. Delete the utility property.
 * 
 * Returns `[CLASS.__dbux_class(), delete CLASS.__dbux_class]` to be inserted after the class.
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
      objectTraceCfg,
      propertyVar // NOTE: this is `undefined`, if `!computed`
    }
  } = traceCfg;

  const o = buildTraceExpressionNoInput(state, objectTraceCfg);
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
  }).expression;

  // build final result
  const resultNode = t.cloneNode(classProperty, false, true); // shallow copy
  resultNode.computed = computed;
  resultNode.key = keyNode;
  resultNode.value = valueNode;
  return resultNode;
}


// ###########################################################################
// instrumentMethodKey
// ###########################################################################

export function instrumentMethodKey(state, traceCfg) {
  const classMethod = getInstrumentTargetAstNode(state, traceCfg);
  const keyPath = traceCfg.path.get('key');

  let {
    key: keyNode,
    computed
  } = classMethod;
  const {
    data: {
      propertyVar // NOTE: this is `undefined`, if `!computed`
    }
  } = traceCfg;

  const p = convertNonComputedPropToStringLiteral(keyNode, computed);

  if (computed) {
    keyNode = t.assignmentExpression('=',
      propertyVar,
      p
    );
  }

  keyPath.replaceWith(keyNode);
}