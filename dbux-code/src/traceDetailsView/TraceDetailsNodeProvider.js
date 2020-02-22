import traceSelection from 'dbux-data/src/traceSelection';
import { NavigationTDNode, NavigationNodeClasses, DetailNodeClasses } from './nodes/traceDetailNodes';
import SelectedTraceNode from './nodes/SelectedTraceNode';
import TraceNode from './nodes/TraceNode';
import EmptyNode from './nodes/EmptyNode';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';

export default class TraceDetailsDataProvider extends BaseTreeViewNodeProvider {
  constructor() {
    super('dbuxTraceDetailsView');
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    const roots = [];

    if (traceSelection.selected) {
      const trace = traceSelection.selected;
      // console.debug('refreshed trace', trace.traceId);
      // const application = allApplications.getById(trace.applicationId);
      const traceNode = this.buildSelectedTraceNode(trace);
      roots.push(traceNode);
    }
    else {
      // add empty node
      roots.push(EmptyNode.instance);
    }

    return roots;
  }

  buildSelectedTraceNode(trace) {
    return this.buildNode(SelectedTraceNode, trace);
  }

  buildTraceNode(trace, parent) {
    return this.buildNode(TraceNode, trace, parent);
  }

  buildTraceDetailNodes(trace, parent) {
    const nodes = [
      // navigation nodes
      ...this.buildNavigationNodes(trace, parent),

      // other detail nodes
      ...this.buildDetailNodes(trace, parent)
    ].filter(node => !!node);

    return nodes;
  }

  // ###########################################################################
  // Detail nodes
  // ###########################################################################

  buildDetailNodes(trace, parent) {
    return DetailNodeClasses.map(NodeClass => 
      this.maybeBuildTraceDetailNode(NodeClass, trace, parent));
  }

  maybeBuildTraceDetailNode(NodeClass, trace, parent) {
    const detail = NodeClass.makeTraceDetail(trace, parent);
    if (!detail) {
      return null;
    }
    const treeItemProps = {
      trace
    };
    return this.buildNode(NodeClass, detail, parent, treeItemProps);
  }

  // ###########################################################################
  // Navigation nodes
  // ###########################################################################

  buildNavigationNodes(trace, parent): NavigationTDNode[] {
    return NavigationNodeClasses.map(NodeClass => {
      return this.buildNavigationNode(NodeClass, trace, parent);
    });
  }

  buildNavigationNode(NodeClass, trace, parent): NavigationTDNode {
    const { controlName } = NodeClass;
    const targetTrace = NodeClass.getTargetTrace(controlName);

    let label;
    if (targetTrace) {
      const arrow = NodeClass.makeArrow(trace, targetTrace, parent);
      label = `${arrow} ${TraceNode.makeLabel(targetTrace, parent)}`;
    }

    const moreProps = {
      trace,
      targetTrace
    };
    return new NodeClass(this, label, targetTrace, parent, moreProps);
  }
}