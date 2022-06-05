

/** ###########################################################################
 * Common (l + r)val stuff
 * ##########################################################################*/

import { ZeroNode } from '../../helpers/traceUtil';

/**
 * 
 * @param {BaseNode} parseNode 
 * @param {AstNode} objectVar
 */
export function makeMETraceData(parseNode, objectVar = null) {
  const { path, Traces } = parseNode;
  const [objectNode, propertyNode] = parseNode.getChildNodes();
  const {
    computed
  } = path.node;

  // NOTE: the order is `object` → `property`
  //    (test case: var o = {x:1}; (console.log(1), o)[console.log(2), 'x'])

  // prepare object
  const objectTraceCfg = objectNode.addDefaultTrace();
  let objectTid = objectTraceCfg?.tidIdentifier;
  if (!objectTid) {
    parseNode.warn(`objectNode did not have traceCfg.tidIdentifier in ${objectNode}`);
    objectTid = ZeroNode;
  }
  objectVar = objectVar || Traces.generateDeclaredUidIdentifier('o');

  // prepare property
  let propertyVar;
  let propTid;
  if (computed) {
    propertyNode.addDefaultTrace();
    propTid = propertyNode?.tidIdentifier;
    propertyVar = Traces.generateDeclaredUidIdentifier('p');
  }
  else {
    // NOTE: we generally don't need a `propTid` if not computed
    propTid = ZeroNode;
  }

  return {
    objectTid,
    objectVar,
    propTid,
    propertyVar
  };
}
