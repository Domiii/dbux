/** ###########################################################################
 * @file Common (l + r)val stuff
 * ##########################################################################*/

import * as t from '@babel/types';
import { astNodeToString } from '../../helpers/pathHelpers';
import { ZeroNode } from '../../helpers/traceUtil';

const ThisNode = t.thisExpression();

/**
 * 
 * @param {BaseNode} parseNode 
 * @param {AstNode} objectVar
 */
export function makeMETraceData(parseNode, objectVar = null, objectTid = null) {
  const { path, Traces } = parseNode;
  const [objectNode, propertyNode] = parseNode.getChildNodes();
  const {
    computed
  } = path.node;

  // NOTE: the order is `object` → `property`
  //    (test case: var o = {x:1}; (console.log(1), o)[console.log(2), 'x'])

  /**
   * Whether caller already took care of tracing object.
   * If not, builder needs to trace object explicitely.
   * 
   * Used in `CallExpression`: object assignment (objectVar = o...) is done in `buildTraceCallME`.
   */
  const alreadyTracedObject = !!objectVar;

  // prepare object
  const objectTraceCfg = objectNode.addDefaultTrace();
  objectTid ||= objectTraceCfg?.tidIdentifier;
  let dontTraceObject = alreadyTracedObject;
  if (!objectTid) {
    objectTid = ZeroNode;

    if (objectNode.path.isSuper()) {
      // hackfix: trace `this` instead of `super`
      objectVar = ThisNode;
      dontTraceObject = true;
    }
    else {
      // parseNode.warn(`objectNode did not have traceCfg.tidIdentifier in ${objectNode}`);
      // objectVar = null;
      objectVar = Traces.generateDeclaredUidIdentifier('o');
    }
  }
  else {
    if (!objectVar || objectVar === true) {
      objectVar = Traces.generateDeclaredUidIdentifier('o');
    }
  }

  // prepare property
  let propertyVar;
  let propTid;
  if (computed) {
    const propTraceCfg = propertyNode.addDefaultTrace();
    propTid = propTraceCfg?.tidIdentifier;
    propertyVar = Traces.generateDeclaredUidIdentifier('p');
  }
  else {
    // NOTE: we generally don't need a `propTid` if not computed
    propTid = ZeroNode;
  }

  return {
    dontTraceObject,
    objectVar,
    objectTid,
    propertyVar,
    propTid
  };
}
