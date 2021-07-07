import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import DataFlowSearchModeType from './DataFlowSearchModeType';
import EmptyNode from './EmptyNode';
import EmptyDataNode from './EmptyDataNode';
import DataFlowFilterModeType from './DataFlowFilterModeType';
import ParentDataNode from './ParentDataNode';

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */
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
        ...this.buildDataNodes(trace, nodeId)
      );
    }

    if (!roots.length) {
      roots.push(EmptyNode.instance);
    }

    return roots;
  }

  /**
   * @param {Trace} trace
   * @param {number} [nodeId]
   */
  buildDataNodes(trace, nodeId) {
    const { applicationId, traceId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    if (!nodeId) {
      ({ nodeId } = trace);
    }
    const dataNode = dp.collections.dataNodes.getById(nodeId);

    if (!dataNode) {
      return [EmptyDataNode.instance];
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
    }).filter(x => !!x) || EmptyArray;

    // return dataNodes?.map((dataNode) => {
    //   const trace = dp.collections.traces.getById(dataNode.traceId);
    //   return this.buildNode(ParentDataNode, trace, null, { dataNode: node });
    // }) || EmptyArray;
  }
}
