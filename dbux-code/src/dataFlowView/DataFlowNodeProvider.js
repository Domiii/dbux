import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import EmptyTreeViewNode from '../codeUtil/EmptyTreeViewNode';
import DataFlowSearchModeType from './DataFlowSearchModeType';
import DataFlowFilterModeType from './DataFlowFilterModeType';
import ParentDataNode from './ParentDataNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */
/** @typedef {import('./dataFlowViewController.js').DataFlowViewController} DataFlowViewController */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DataFlowNodeProvider');

export default class DataFlowNodeProvider extends BaseTreeViewNodeProvider {
  /**
   * @param {DataFlowViewController} controller
   */
  constructor(controller) {
    super('dbuxDataFlowView');
    this.controller = controller;
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    const roots = [];

    if (traceSelection.selected) {
      const trace = traceSelection.selected;
      const { nodeId } = traceSelection;

      roots.push(
        ...(this.buildDataNodes(trace, nodeId) || EmptyArray)
      );

      if (!roots.length) {
        roots.push(EmptyTreeViewNode.get('(trace has no value)'));
      }
    }
    else {
      roots.push(EmptyTreeViewNode.get('(no trace selected)'));
    }

    return roots;
  }

  /**
   * @param {Trace} trace
   * @param {number} [nodeId]
   */
  buildDataNodes(trace, nodeId) {
    const { applicationId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    trace = dp.util.getValueTrace(trace.traceId);

    const { traceId } = trace;

    if (!nodeId) {
      ({ nodeId } = trace);
    }
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (!dataNode) {
      return null;
    }

    if (dataNode.traceId !== traceId) {
      // sanity check
      warn(`Rendering dataNode ${JSON.stringify(dataNode)} but its trace is not selected.`);
    }

    // apply filters
    const { accessId, valueId } = dataNode;
    let dataNodes;
    if (DataFlowSearchModeType.is.ByAccessId(this.controller.searchMode)) {
      dataNodes = dp.indexes.dataNodes.byAccessId.get(accessId);
    }
    else if (DataFlowSearchModeType.is.ByValueId(this.controller.searchMode)) {
      dataNodes = dp.indexes.dataNodes.byValueId.get(valueId);
    }

    if (DataFlowFilterModeType.is.ReadOnly(this.controller.filterMode)) {
      dataNodes = dataNodes?.filter(node => DataNodeType.is.Read(node.type));
    }
    else if (DataFlowFilterModeType.is.WriteOnly(this.controller.filterMode)) {
      dataNodes = dataNodes?.filter(node => DataNodeType.is.Write(node.type));
    }

    const dataTraceIds = new Set();
    return dataNodes?.map((node) => {
      const dataTrace = dp.collections.traces.getById(node.traceId);
      if (dataTraceIds.has(dataTrace.traceId)) {
        return null;
      }
      else {
        dataTraceIds.add(dataTrace.traceId);
        return this.buildNode(ParentDataNode, dataTrace, null, { dataNode: node });
      }
    }).filter(x => !!x);

    // return dataNodes?.map((dataNode) => {
    //   const trace = dp.collections.traces.getById(dataNode.traceId);
    //   return this.buildNode(ParentDataNode, trace, null, { dataNode: node });
    // }) || EmptyArray;
  }
}
