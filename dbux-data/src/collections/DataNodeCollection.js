import SpecialObjectType from '@dbux/common/src/types/constants/SpecialObjectType';
import DataNode from '@dbux/common/src/types/DataNode';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import Collection from '../Collection';

/**
 * @extends {Collection<DataNode>}
 */
export default class DataNodeCollection extends Collection {
  constructor(dp) {
    super('dataNodes', dp);
    this.accessUIdMap = new Map();
  }

  /**
   * @param {DataNode} dataNode
   */
  getValueId(dataNode) {
    if (dataNode.valueId > 0) {
      return dataNode.valueId;
    }

    if (dataNode.refId) {
      const firstRef = this.dp.indexes.dataNodes.byRefId.getFirst(dataNode.refId);
      return firstRef.nodeId;
    }
    else {
      const { nodeId, traceId, accessId } = dataNode;
      const { contextId, staticTraceId, nodeId: traceNodeId } = this.dp.collections.traces.getById(traceId);
      const staticTrace = traceNodeId === nodeId && this.dp.collections.staticTraces.getById(staticTraceId);

      if (dataNode.inputs?.length && (!staticTrace || (staticTrace?.dataNode && !staticTrace.dataNode.isNew))) {
        const inputDataNode = this.dp.collections.dataNodes.getById(dataNode.inputs[0]);
        if (!inputDataNode) {
          const traceInfo = this.dp.util.makeTraceInfo(traceId);
          this.logger.warn(`[getValueId] Cannot lookup dataNode.inputs[0] (inputs=${JSON.stringify(dataNode.inputs)}) at trace: ${traceInfo}`);
          return nodeId;
        }
        return inputDataNode.valueId;
      }

      const lastNode = this.dp.indexes.dataNodes.byAccessId.getLast(accessId);
      if (accessId && lastNode) {
        // warn(`[getValueId] Cannot find accessId of dataNode: ${JSON.stringify(dataNode)}`);
        // NOTE: currently, last in `byAccessId` index is actually "the last before this one", since we are still resolving the index.
        return lastNode.valueId;
      }

      const { specialObjectType } = this.dp.util.getDataNodeValueRef(dataNode.varAccess?.objectNodeId) || EmptyObject;
      if (specialObjectType) {
        // NOTE: specialObjectType is looked up by `valueId`
        // future-work: don't create functions dynamically, unless absolutely necessary -> Move to class instead.
        const SpecialObjectTypeHandlers = {
          [SpecialObjectType.Arguments]: ({ varAccess: { prop } }) => {
            const callerTrace = this.dp.util.getOwnCallerTraceOfContext(contextId);
            if (callerTrace) {
              // NOTE: sometimes, (e.g. in root contexts) we might not have an "own" caller trace
              const obj = this.dp.util.getCallArgDataNodes(callerTrace.traceId);
              const arg = obj[prop];
              // NOTE: `arg` might not be recorded
              return arg?.valueId || null;
            }
            return null;
          }
        };
        const specialValueId = SpecialObjectTypeHandlers[specialObjectType](dataNode);
        if (specialValueId) {
          return specialValueId;
        }
      }

      // eslint-disable-next-line max-len
      // this.logger.warn(`[getValueId] Cannot find valueId for dataNode.\n    trace: ${this.dp.util.makeTraceInfo(traceId)}\n    dataNode: ${JSON.stringify(dataNode)}`);

      return nodeId;
    }
  }

  getAccessId(dataNode) {
    if (dataNode.accessId > 0) {
      return dataNode.accessId;
    }

    const { varAccess } = dataNode;
    if (!varAccess) {
      return null;
    }
    else {
      let key;
      const { declarationTid, objectNodeId, prop } = varAccess;
      if (declarationTid) {
        key = declarationTid;
      }
      else if (objectNodeId) {
        const objectDataNode = this.dp.collections.dataNodes.getById(objectNodeId);
        const objectValueId = objectDataNode.valueId;
        if (!objectValueId) {
          // sanity check
          const { traceId } = dataNode;
          const traceInfo = this.dp.util.makeTraceInfo(traceId);
          this.logger.warn(`[getAccessId] Cannot find objectValueId of DataNode for trace: ${traceInfo}`);
          key = null;
        }
        else {
          key = `${objectValueId}#${prop}`;
        }
      }
      else {
        const { traceId } = dataNode;
        const traceInfo = this.dp.util.makeTraceInfo(traceId);
        this.logger.warn(`[getAccessId] DataNode has neither objectNodeId nor declarationTid for trace: ${traceInfo}`);
        return null;
      }

      if (!this.accessUIdMap.get(key)) {
        this.accessUIdMap.set(key, this.accessUIdMap.size + 1);
      }
      return this.accessUIdMap.get(key);
    }
  }

  postIndexProcessed(dataNodes) {
    this.errorWrapMethod('resolveDataIds', dataNodes);
  }

  /**
   * Resolves `accessId` and `valueId` simultaneously.
   * Manually add the index entries (because this is run `postIndex`).
   * @param {DataNode[]} dataNodes 
   */
  resolveDataIds(dataNodes) {
    for (const dataNode of dataNodes) {
      dataNode.accessId = this.getAccessId(dataNode);
      dataNode.valueId = this.getValueId(dataNode);
      this.dp.indexes.dataNodes.byAccessId.addEntry(dataNode);
      this.dp.indexes.dataNodes.byValueId.addEntry(dataNode);
    }
  }

  _reportInvalidId(idx, faultyEntry, recoverable) {
    const { traceId } = faultyEntry || EmptyObject;
    const traceInfo = traceId && this.dp.util.makeTraceInfo(traceId) || '(no trace)';
    this.logger.error(`entry._id !== id (recoverable=${recoverable}) - First invalid entry is at #${idx}: ${traceInfo} ${JSON.stringify(faultyEntry)}`);
  }

  serialize(dataNode) {
    const dataNodeObj = { ...dataNode };
    delete dataNodeObj._valueString;
    delete dataNodeObj._valueStringShort;
    return dataNodeObj;
  }
}