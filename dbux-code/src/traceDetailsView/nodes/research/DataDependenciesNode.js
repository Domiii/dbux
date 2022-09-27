import DataNodeType, { isDataNodeRead, isDataNodeWrite } from '@dbux/common/src/types/constants/DataNodeType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import ValueTypeCategory from '@dbux/common/src/types/constants/ValueTypeCategory';
import { makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import TraceDetailNode from '../TraceDetailNode';
import TraceNode from '../../../codeUtil/treeView/TraceNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

export default class DataDependenciesNode extends TraceDetailNode {
  static makeLabel(/* trace, parent */) {
    return 'CrossThreadDataDependencies';
  }
  buildChildren() {
    const selectedTrace = traceSelection.selected;
    const emptySet = new Set();

    if (selectedTrace) {
      const dp = allApplications.getById(selectedTrace.applicationId).dataProvider;
      /** @type {Map<number, Set<number>>} */ const resultsByTargetTraceId = new Map();
      const results = [];
      const addedStaticTraceIds = new Set();
      for (const dataNode of dp.collections.dataNodes.getAllActual()) {
        const { nodeId, type, refId, traceId: accessTraceId } = dataNode;

        // get threadId of access
        const rootContext = dp.util.getRootContextOfTrace(accessTraceId);
        const { threadId } = dp.util.getAsyncNode(rootContext.contextId);

        // ignore functions (for now)
        if (refId) {
          const ref = dp.collections.values.getById(refId);
          if (ValueTypeCategory.is.Function(ref?.category)) {
            continue;
          }
        }

        // get target trace
        const accessedObjectNode = dp.util.getDataNodeAccessedObjectNode(nodeId);
        let targetTraceId, targetNode = accessedObjectNode || dataNode;
        if (targetNode.refId) {
          // reference type → find first occurrence of reference
          targetNode = dp.indexes.dataNodes.byRefId.getFirst(targetNode.refId);
          ({ traceId: targetTraceId } = targetNode);
        }
        else {
          if (targetNode.varAccess?.declarationTid) {
            targetTraceId = targetNode.varAccess?.declarationTid;
          }
          else {
            targetTraceId = targetNode.traceId;
          }
        }
        if (!targetTraceId) {
          continue;
        }

        if (isDataNodeWrite(type)) {
          if (!resultsByTargetTraceId.get(targetTraceId)) {
            resultsByTargetTraceId.set(targetTraceId, new Set());
          }
          resultsByTargetTraceId.get(targetTraceId).add(threadId);
        }
        else if (isDataNodeRead(type)) {
          const writtenThreads = resultsByTargetTraceId.get(targetTraceId) || emptySet;
          if ((writtenThreads.size - writtenThreads.has(threadId)) > 0) {
            // first read after write
            const trace = dp.collections.traces.getById(targetTraceId);
            if (!addedStaticTraceIds.has(trace.staticTraceId)) { // only add one per staticTraceId
              addedStaticTraceIds.add(trace.staticTraceId);
              let labelOverride = targetNode.refId ?
                dp.util.findRefFirstVarName(targetNode.refId) :
                makeTraceLabel(trace);
              results.push({ trace, labelOverride/* , firstReadTid: accessTraceId */ });
            }
          }
        }
      }

      return results
        .filter(({ trace: { traceId } }) => {
          const writtenThreads = resultsByTargetTraceId.get(traceId);
          // ignore results that were only written in entry point thread (for now) → removes a lot of const vars
          return writtenThreads.size > 1 || writtenThreads.values().next().value > 1;
        })
        .map(({ trace, labelOverride }) => {
          const writtenThreads = Array.from(resultsByTargetTraceId.get(trace.traceId));
          return this.treeNodeProvider.buildNode(TraceNode, trace, this, { labelOverride });
        });
    }
    else {
      return EmptyArray;
    }
  }
}
