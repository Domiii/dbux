import groupBy from 'lodash/groupBy';
import allApplications from 'dbux-data/src/applications/allApplications';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import { getTracesAt } from '../helpers/codeRangeQueries';
import { getCursorLocation } from '../codeNav';
import TraceNode from './nodes/TraceNode';
import EmptyNode from './nodes/EmptyNode';

export default class EditorTracesDataProvider extends BaseTreeViewNodeProvider {
  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    // console.warn('details refresh');
    this.where = getCursorLocation();

    const roots = [];

    if (this.where) {
      // all traces available at cursor in editor
      const {
        fpath,
        pos
      } = this.where;

      this.rootNodes.push(...allApplications.selection.data.mapApplicationsOfFilePath(
        fpath, (application, programId) => {
          const traceNodes = this.buildTraceNodes(programId, pos, application, null);
          return traceNodes || EmptyArray;
        }
      ));
    }
    else {
      // empty node
      roots.push(EmptyNode.instance);
    }

    return roots;
  }

  buildTraceNodes(programId, pos, application, parent) {
    // const { staticTraceId } = staticTrace;
    // const traces = application.dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);

    const traces = getTracesAt(application, programId, pos);
    if (!traces?.length) {
      return null;
    }

    // group by context, then sort by `contextId` (most recent first)
    const traceGroups = Object.values(
      groupBy(traces, 'contextId')
    )
      .sort((a, b) => b[0].contextId - a[0].contextId);

    return traceGroups.map(traceGroup => {
      // start with inner-most (oldest) trace
      const trace = traceGroup[0];
      const node = this.buildTraceNode(trace, application, parent);

      // add other traces as children (before details) 
      const otherTraces = traceGroup.slice(1);
      const otherNodes = otherTraces
        .map(other => {
          const child = this.buildTraceNode(other, application, node);
          // child.collapsibleState = TreeItemCollapsibleState.Collapsed;
          return child;
        });
      // node.children.unshift(...otherNodes);  // add before
      node.children.push(...otherNodes);    // add behind

      return node;
    });
  }

  buildTraceNode(trace, application, parent) {
    return this.buildNode(TraceNode, trace, application, parent);
  }
}
