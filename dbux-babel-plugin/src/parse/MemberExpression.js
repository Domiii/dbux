import BaseExpression from './BaseExpression';

// TODO

function getObjectReferenceId(obj) {
  // TODO: use WeakMap to store unique object id
}
function makeObjectAccessPath(obj, prop) {
  // TODO: obj is not necessarily reference type
  // TODO: string needs a lot of special treatment (e.g. `s.toString().toString().toString()`)
  return `${getObjectReferenceId(obj)}.${prop}`;
}
function getObjectAccessId(obj, prop, val) {
  if (isReferenceType(val)) {
    return getObjectReferenceId(val);
  }
  else {
    return makeObjectAccessPath(obj, prop);
  }
}
// ...

// TODO: get `lvarBindingId`
// @param lvarBindingId `traceId` of left-most object variable binding (i.e. traceId of `let o;` for `o.
/**
 * in:  o.p[q[b].c][d].y.w
 * out: o[meProp(o, [te(q[meProp(q, [te(b, %tid1a%)])], %tid1%), te(d, %tid2%)], [tid1, tid2], %tid0%)]
 *
 * TODO: s.toString().toString().toString()
 */
function meProp(lObj, dynamicArgVals, dynamicArgTraceIds, traceId) {
  const meStaticTrace = getStaticTrace(traceId);
  let { template, dynamicIndexes, isLVal } = meStaticTrace;
  // if (dynamicArgTraceIds.length < dynamicIndexes.length) {
  //   // TODO: OptionalMemberExpression (non-lval only)
  //   dynamicIndexes = dynamicIndexes.slice(0, dynamicArgTraceIds.length);
  // }

  const objectRefs = [getObjectRefId(lObj)];
  let val = lObj;
  let dynamicI = -1;
  for (let i = 1; i < template.length; ++i) {
    if (!val) {
      // TODO: error will usually be thrown here
    }
    let prop = template[i];
    if (!prop) {
      prop = dynamicArgVals[++dynamicI];
    }

    const obj = val;
    val = val[prop];

    objectRefs.push(getObjectAccessId(obj, prop, val));
  }

  // TODO: if commitWrite { ... }

  // TODO: register inputs/outputs
  //  { objectRefs }

  return val;
}







/** @typedef {import('@babel/types/lib').Identifier} Identifier */

export default class MemberExpression extends BaseExpression {
  /**
   * @example `o` in `o.a[x].b.c[y]`
   * @type {Identifier}
   */
  leftId;
  template = [];
  dynamicIndexes = [];
  // staticNodes = [];
  // dynamicNodes = [];

  // init() {
  // }


  // ###########################################################################
  // enter
  // ###########################################################################

  static shouldCreateOnEnter(path/* , state */) {
    return !path.parentPath.isMemberExpression() || path.node === path.parentPath.node.property;
  }

  enter() {
  }


  // ###########################################################################
  // exit
  // ###########################################################################

  static nodes = ['object', 'property'];

  exit(object, property, [objectPath, propertyPath]) {
    const {
      dynamicIndexes,
      template,
      path
    } = this;

    const { computed/* , optional */ } = path.node;

    // inner-most ME is exited first; has left-most id
    if (!this.leftId) {
      this.leftId = objectPath.node;
      template.push(objectPath.toString());
    }

    // TODO: optional

    if (computed) {
      dynamicIndexes.push(template.length);
      template.push(null);
    }
    else {
      template.push(propertyPath.toString());
    }

    // TODO: only return on final exit

    return {
      template,
      dynamicIndexes
    };
  }


  // ###########################################################################
  // gen
  // ###########################################################################

  instrument(staticData, state) {
    // TODO: instrument
  }
}
