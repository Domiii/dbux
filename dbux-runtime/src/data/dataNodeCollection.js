import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import Trace from '@dbux/common/src/types/Trace';
import Collection from './Collection';
import pools from './pools';
import staticTraceCollection from './staticTraceCollection';
import traceCollection from './traceCollection';
import valueCollection from './valueCollection';

const Verbose = 0;
// const Verbose = 1;

export const ShallowValueRefMeta = {
  shallow: true
};

export class DataNodeCollection extends Collection {
  constructor() {
    super('dataNodes');
  }


  /**
   * @param {Trace} trace 
   */
  createDataNodes(value, traceId, varAccess, inputs) {
    const dataNode = this.createOwnDataNode(value, traceId, varAccess, inputs);


    // TODO: resolve deferred access
    // const deferredChildrenTids = getDeferredTids(tid);

    // handleNodeX(value, trace, dataNode, inputs, deferredChildrenTids);
    return dataNode;
  }

  createOwnDataNode(value, traceId, type, varAccess = null, inputs = null, meta = null) {
    const trace = traceCollection.getById(traceId);
    if (!meta) {
      const staticTrace = staticTraceCollection.getById(trace.staticTraceId);
      ({ dataNode: meta } = staticTrace);
      // console.warn(traceId, meta);
    }
    const dataNode = this.createDataNode(value, traceId, type, varAccess, inputs, meta);
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
  createWriteNodeFromTrace(writeTraceId, readTraceId, varAccess) {
    const readTrace = traceCollection.getById(readTraceId);
    if (!readTrace) {
      this.logger.warn(new Error(`Could not lookup trace of readTraceId ${readTraceId} in createWriteNodeFromTrace`));
      return null;
    }
    const { nodeId: readNodeId } = readTrace;
    const readNode = this.getById(readNodeId);
    return this.createWriteNodeFromReadNode(writeTraceId, readNode, varAccess);
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

    // if (traceId === 324908) {
    // if (dataNode.nodeId === 302071) {
    //   console.trace('createDataNode', traceCollection.makeTraceInfo(traceId), dataNode);
    // }

    this._send(dataNode);

    return dataNode;
  }
}


// ###########################################################################
// export
// ###########################################################################

/**
 * @type {DataNodeCollection}
 */
const dataNodeCollection = new DataNodeCollection();
export default dataNodeCollection;