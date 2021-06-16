import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import TraceNode from '../traceDetailsView/nodes/TraceNode';
import DataFlowSearchModeType from './DataFlowSearchModeType';
import EmptyNode from './EmptyNode';
import EmptyDataNode from './EmptyDataNode';
import DataFlowFilterModeType from './DataFlowFilterModeType';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */
/** @typedef {import('./dataFlowViewController.js').DataFlowViewController} DataFlowViewController */

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

      roots.push(
        ...this.buildDataNodes(trace)
      );
    }

    if (!roots.length) {
      roots.push(EmptyNode.instance);
    }

    return roots;
  }

  /**
   * @param {Trace} trace
   */
  buildDataNodes(trace) {
    const { applicationId, traceId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const dataNode = dp.indexes.dataNodes.byTrace.getFirst(traceId);
    if (!dataNode) {
      return [EmptyDataNode.instance];
    }
    
    const { accessId, valueId } = dataNode;
    let dataNodes;
    if (DataFlowSearchModeType.is.ByAccessId(this.controller.searchMode)) {
      dataNodes = dp.indexes.dataNodes.byAccessId.get(accessId);
    }
    else if (DataFlowSearchModeType.is.ByValueId(this.controller.searchMode)) {
      dataNodes = dp.indexes.dataNodes.byValueId.get(valueId);
    }

    if (DataFlowFilterModeType.is.ReadOnly(this.controller.filterMode)) {
      dataNodes = dataNodes?.filter(node => DataNodeType.is.Read(node.type))
    }
    else if (DataFlowFilterModeType.is.WriteOnly(this.controller.filterMode)) {
      dataNodes = dataNodes?.filter(node => DataNodeType.is.Write(node.type))
    }

    return dataNodes?.map(({ traceId }) => {
      const childTrace = dp.collections.traces.getById(traceId);
      return this.buildNode(TraceNode, childTrace, null);
    }) || EmptyArray;
  }
}
