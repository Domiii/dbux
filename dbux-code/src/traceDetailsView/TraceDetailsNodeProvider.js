import traceSelection from '@dbux/data/src/traceSelection';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import EmptyTreeViewNode from '../codeUtil/treeView/EmptyNode';
import { DetailNodeClasses } from './nodes/traceDetailNodes';
import SelectedTraceNode from './nodes/SelectedTraceNode';
import TraceNode from '../codeUtil/treeView/TraceNode';
import BaseTreeViewNodeProvider from '../codeUtil/treeView/BaseTreeViewNodeProvider';
import NavigationNode from './nodes/NavigationNode';

export default class TraceDetailsDataProvider extends BaseTreeViewNodeProvider {
  constructor() {
    super('dbuxTraceDetailsView');

    this.trace = null;
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    this.logger.log(`Start building roots...`);
    const roots = [];

    if (traceSelection.selected) {
      const trace = traceSelection.selected;
      this.trace = trace;

      roots.push(
        this.buildSelectedTraceNode(trace),
        ...this.buildTraceDetailNodes(trace, null)
      );
    }
    else {
      this.trace = null;
      // add empty node
      roots.push(EmptyTreeViewNode.get('(no trace selected)'));
    }

    this.logger.log(`Roots built`);
    return roots;
  }

  buildTraceDetailNodes(trace, parent) {
    const nodes = [
      // navigation node
      this.buildNavigationNode(trace, parent),

      // other detail nodes
      ...this.buildDetailNodes(trace, parent, DetailNodeClasses)
    ].filter(node => !!node);

    return nodes;
  }

  // ###########################################################################
  // Detail nodes
  // ###########################################################################

  buildDetailNodes(trace, parent, NodeClasses) {
    return NodeClasses
      .map(NodeClass => this.maybeBuildTraceDetailNode(NodeClass, trace, parent))
      .filter(node => !!node);
  }

  maybeBuildTraceDetailNode(NodeClass, trace, parent, props) {
    let entry = trace;
    if (NodeClass.makeEntry) {
      // Some NodeClasses might depend on non-trace entry
      entry = NodeClass.makeEntry(trace, parent, props);
      if (!entry) {
        return null;
      }
    }
    return this.buildNode(NodeClass, entry, parent, props);
  }

  // ###########################################################################
  // Util
  // ###########################################################################

  buildSelectedTraceNode(trace) {
    return this.buildNode(SelectedTraceNode, trace);
  }

  buildNavigationNode(trace, parent) {
    return this.buildNode(NavigationNode, trace, parent);
  }

  buildTraceNode(trace, parent) {
    return this.buildNode(TraceNode, trace, parent);
  }
}