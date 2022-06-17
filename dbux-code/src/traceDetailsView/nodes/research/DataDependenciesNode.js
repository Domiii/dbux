import { newLogger } from '@dbux/common/src/log/logger';
import DataNodeType, { isDataNodeRead, isDataNodeWrite } from '@dbux/common/src/types/constants/DataNodeType';
import StaticContextType from '@dbux/common/src/types/constants/StaticContextType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import TraceDetailNode from '../TraceDetailNode';
import TraceNode from '../../../codeUtil/treeView/TraceNode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DataDependencies');

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * main node
 * ##########################################################################*/

export default class DataDependenciesNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'CrossThreadDataDependencies';
  }

  buildChildren() {
    const selectedTrace = traceSelection.selected;
    const emptySet = new Set();

    if (selectedTrace) {
      const dp = allApplications.getById(selectedTrace.applicationId).dataProvider;
      const writtenThreadsByAccessId = new Map();
      const globalAccessIds = new Set();
      for (const dataNode of dp.collections.dataNodes.getAllActual()) {
        const { type, accessId, traceId } = dataNode;
        if (!accessId) {
          continue;
        }
        const rootContext = dp.util.getRootContextOfTrace(traceId);
        const staticContext = dp.collections.staticContexts.getById(rootContext.staticContextId);
        if (staticContext.type === StaticContextType.Program) {
          continue;
        }
        const { threadId } = dp.util.getAsyncNode(rootContext.contextId);
        if (isDataNodeWrite(type)) {
          if (!writtenThreadsByAccessId.get(accessId)) {
            writtenThreadsByAccessId.set(accessId, new Set());
          }
          writtenThreadsByAccessId.get(accessId).add(threadId);
        }
        else if (isDataNodeRead(type)) {
          const writtenThreads = writtenThreadsByAccessId.get(accessId) || emptySet;
          if ((writtenThreads.size - writtenThreads.has(threadId)) > 0) {
            globalAccessIds.add(accessId);
          }
        }
      }
      const globalTraceIds = new Set();
      const addedStaticTraceIds = new Set();
      for (const accessId of globalAccessIds.values()) {
        const { varAccess } = dp.indexes.dataNodes.byAccessId.getFirst(accessId);
        let _traceId;
        if (varAccess.objectNodeId) {
          _traceId = dp.collections.dataNodes.getById(varAccess.objectNodeId).traceId;
        }
        else if (varAccess.declarationTid) {
          _traceId = varAccess.declarationTid;
        }
        const t = dp.collections.traces.getById(_traceId);
        if (!addedStaticTraceIds.has(t.staticTraceId)) {
          addedStaticTraceIds.add(t.staticTraceId);
          globalTraceIds.add(t);
        }
      }
      return Array.from(globalTraceIds.values()).map(trace => {
        const dataNode = dp.collections.dataNodes.getById(trace.nodeId);
        if (!dataNode.varAccess) {
          const dataNodesByValueId = dp.indexes.dataNodes.byValueId.get(dataNode.valueId) || EmptyArray;
          const nextDataNode = dataNodesByValueId[dataNodesByValueId.indexOf(dataNode) + 1];
          trace = dp.collections.traces.getById(nextDataNode.traceId);
        }
        return this.treeNodeProvider.buildNode(TraceNode, trace, this);
      });
    }
    else {
      return EmptyArray;
    }
  }
}
