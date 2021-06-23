import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import Trace from '@dbux/common/src/core/data/Trace';
import { newLogger } from '@dbux/common/src/log/logger';
import isObject from 'lodash/isObject';
import Collection from './Collection';
import pools from './pools';
import staticTraceCollection from './staticTraceCollection';
import traceCollection from './traceCollection';
import valueCollection from './valueCollection';

const Verbose = 0;
// const Verbose = 1;

export class DataNodeCollection extends Collection {
  constructor() {
    super('dataNodes');
  }


  /**
   * @param {Trace} trace 
   */
  createDataNodes(value, traceId, varAccess, inputs) {
    // const staticTrace = staticTraceCollection.getStaticTrace(trace.staticTraceId);
    // const { dataNode: staticDataNode } = staticTrace;

    const dataNode = this.createOwnDataNode(value, traceId, varAccess, inputs);


    // TODO: resolve deferred access
    // const deferredChildrenTids = getDeferredTids(tid);

    // handleNodeX(value, trace, dataNode, inputs, deferredChildrenTids);
    return dataNode;
  }

  createOwnDataNode(value, traceId, type, varAccess = null, inputs = null, meta = null) {
    const dataNode = this.createDataNode(value, traceId, type, varAccess, inputs, meta);
    const trace = traceCollection.getById(traceId);
    trace.nodeId = dataNode.nodeId;
    return dataNode;
  }

  /**
   * Sometimes a single trace doubles as a read and a write node.
   * In that case:
   * * the read was the (only) previously recorded DataNode of that Trace
   * * the `refId` of the two is the same
   * * the new write node's single input is the read node
   */
  createWriteNodeFromTrace(traceId, varAccess) {
    const trace = traceCollection.getById(traceId);
    if (!trace) {
      this.logger.warn(`Could not lookup trace of traceId ${traceId} in createWriteNodeFromTrace`);
      return null;
    }
    const { nodeId: readNodeId } = trace;
    const readNode = this.getById(readNodeId);
    return this.createWriteNodeFromReadNode(traceId, readNode, varAccess);
  }

  /**
   * NOTE: Used by `UpdateExpression`.
   */
  createWriteNodeFromInputTrace(inputTraceId, traceId) {
    const { nodeId: readNodeId } = traceCollection.getById(inputTraceId);
    const readNode = this.getById(readNodeId);
    return this.createWriteNodeFromReadNode(traceId, readNode, readNode.varAccess);
  }

  createWriteNodeFromReadNode(traceId, readNode, varAccess) {
    const inputs = [readNode.nodeId];
    const writeNode = this.createDataNode(undefined, traceId, DataNodeType.Write, varAccess, inputs);
    writeNode.refId = readNode.refId;
    return writeNode;
  }

  createDataNode(value, traceId, type, varAccess, inputs, meta = null) {
    const dataNode = pools.dataNodes.allocate();

    dataNode.nodeId = this._all.length;
    dataNode.traceId = traceId;
    dataNode.type = type;
    dataNode.inputs = inputs;

    this.push(dataNode);
    

    // valueRef
    const valueRef = valueCollection.registerValueMaybe(value, dataNode, meta);

    dataNode.refId = valueRef?.refId || 0;
    dataNode.varAccess = varAccess;

    if (Verbose) {
      const valueStr = dataNode.refId ? `refId=${dataNode.refId}` : `value=${value}`;
      this.logger.debug(`createDataNode #${dataNode.nodeId}, ${DataNodeType.nameFromForce(type)}, tid=${traceId}, varAccess=${JSON.stringify(varAccess)}, ${valueStr}`);
    }

    this._send(dataNode);

    return dataNode;
  }

  // ###########################################################################
  // util
  // ###########################################################################

  // // TODO: get `lvarBindingId`
  // // @param lvarBindingId `traceId` of left-most object variable binding (i.e. traceId of `let o;` for `o.
  // /**
  //  * in:  o.p[q[b].c][d].y.w
  //  * out: o[meProp(o, [te(q[meProp(q, [te(b, %tid1a%)])], %tid1%), te(d, %tid2%)], [tid1, tid2], %tid0%)]
  //  *
  //  * TODO: s.toString().toString().toString()
  //  */
  // meProp(lObj, dynamicArgVals, dynamicArgTraceIds, traceId) {
  //   const meStaticTrace = getStaticTrace(traceId);
  //   let { template, dynamicIndexes, isLVal } = meStaticTrace;
  //   // if (dynamicArgTraceIds.length < dynamicIndexes.length) {
  //   //   // TODO: OptionalMemberExpression (non-lval only)
  //   //   dynamicIndexes = dynamicIndexes.slice(0, dynamicArgTraceIds.length);
  //   // }

  //   const objectRefs = [getObjectRefId(lObj)];
  //   let val = lObj;
  //   let dynamicI = -1;
  //   for (let i = 1; i < template.length; ++i) {
  //     if (!val) {
  //       // TODO: error will usually be thrown here
  //     }
  //     let prop = template[i];
  //     if (!prop) {
  //       prop = dynamicArgVals[++dynamicI];
  //     }

  //     const obj = val;
  //     val = val[prop];

  //     objectRefs.push(getObjectAccessId(obj, prop, val));
  //   }

  //   // TODO: if commitWrite { ... }

  //   // TODO: register inputs/outputs
  //   //  { objectRefs }

  //   return val;
  // }
}


// ###########################################################################
// export
// ###########################################################################

/**
 * @type {DataNodeCollection}
 */
const dataNodeCollection = new DataNodeCollection();
export default dataNodeCollection;