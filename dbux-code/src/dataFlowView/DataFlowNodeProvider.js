import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNodeType, { isDataNodeRead, isDataNodeWrite } from '@dbux/common/src/types/constants/DataNodeType';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import BaseTreeViewNodeProvider from '../codeUtil/treeView/BaseTreeViewNodeProvider';
import EmptyTreeViewNode from '../codeUtil/treeView/EmptyNode';
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
    // TODO: move all this data-related stuff to dbux-data

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
    const { accessId, valueId, refId } = dataNode;
    /**
     * @type {DataNode[]}
     */
    let dataNodes;
    let firstNode = null;
    if (DataFlowSearchModeType.is.ByAccessId(this.controller.searchMode)) {
      dataNodes = dp.indexes.dataNodes.byAccessId.get(accessId);
    }
    else if (DataFlowSearchModeType.is.ByValueId(this.controller.searchMode)) {
      dataNodes = dp.indexes.dataNodes.byValueId.get(valueId);

      if (refId) {
        firstNode = dp.util.getAnyFirstNodeByRefId(dataNode.refId);
      }
    }

    if (DataFlowFilterModeType.is.ReadOnly(this.controller.filterMode)) {
      dataNodes = dataNodes?.filter(node => isDataNodeRead(node.type));
    }
    else if (DataFlowFilterModeType.is.WriteOnly(this.controller.filterMode)) {
      dataNodes = dataNodes?.filter(node => isDataNodeWrite(node.type));
    }

    const dataTraceIds = new Set();

    if (firstNode && dataNodes?.[0]?.nodeId !== firstNode.nodeId) {
      // manually add first trace
      // see https://github.com/Domiii/dbux/issues/702
      dataNodes = [firstNode, ...dataNodes]; // NOTE: don't modify the original array
    }

    return dataNodes?.map((node) => {
      const dataTrace = dp.collections.traces.getById(node.traceId);
      if (dataTraceIds.has(dataTrace.traceId)) {
        return null;
      }
      else {
        dataTraceIds.add(dataTrace.traceId);
        /**
         * @type {ParentDataNode}
         */
        const dataNodeNode = this.buildNode(ParentDataNode, node, null);
        // dataNodeNode.targetNodeId = ;
        return dataNodeNode;
      }
    }).filter(x => !!x);

    // return dataNodes?.map((dataNode) => {
    //   const trace = dp.collections.traces.getById(dataNode.traceId);
    //   return this.buildNode(ParentDataNode, trace, null, { dataNode: node });
    // }) || EmptyArray;
  }
}
