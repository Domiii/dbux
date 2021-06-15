import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import TraceNode from '../traceDetailsView/nodes/TraceNode';
import DataFlowViewModeType from './DataFlowViewModeType';
import EmptyNode from './EmptyNode';
import EmptyDataNode from './EmptyDataNode';

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */

export default class DataFlowNodeProvider extends BaseTreeViewNodeProvider {
  constructor() {
    super('dbuxDataFlowView');
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
    const dataNodes = dp.indexes.dataNodes.byTrace.get(traceId);
    const dataNode = dp.indexes.dataNodes.byTrace.getFirst(traceId);
    if (!dataNode) {
      return [EmptyDataNode.instance];
    }
    
    const { accessId, valueId } = dataNode;
    let childDataNodes;
    if (DataFlowViewModeType.is.ByAccessId(this.controller.mode)) {
      childDataNodes = dp.indexes.dataNodes.byAccessId.get(accessId);
    }
    else if (DataFlowViewModeType.is.ByValueId(this.controller.mode)) {
      childDataNodes = dp.indexes.dataNodes.byValueId.get(valueId);
    }

    return childDataNodes?.map(({ traceId }) => {
      const childTrace = dp.collections.traces.getById(traceId);
      return this.buildNode(TraceNode, childTrace, null);
    }) || EmptyArray;
  }
}
