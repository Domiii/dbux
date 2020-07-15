import groupBy from 'lodash/groupBy';
import allApplications from '@dbux/data/src/applications/allApplications';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import BaseTreeViewNodeProvider from '../codeUtil/BaseTreeViewNodeProvider';
import { getTracesAt } from '../helpers/codeRangeQueries';
import { getCursorLocation } from '../codeUtil/codeNav';
import TraceNode from './nodes/TraceNode';
import EmptyNode from './nodes/EmptyNode';

export default class EditorTracesNodeProvider extends BaseTreeViewNodeProvider {
  constructor() {
    super('dbuxEditorTracesView');
  }

  // ###########################################################################
  // tree building
  // ###########################################################################

  buildRoots() {
    // console.warn('details refresh');
    this.where = getCursorLocation();

    let roots = [];

    if (this.where) {
      // all traces available at cursor in editor
      const {
        fpath,
        pos
      } = this.where;

      roots.push(
        ...allApplications.selection.data.mapApplicationsOfFilePath(
          fpath, (application, programId) => {
            const traceNodes = this.buildTraceNodes(programId, pos, application, null);
            return traceNodes || EmptyArray;
          }
        )
      );
    }

    if (!roots.length) {
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
      // start with inner-most (oldest) trace (biggest contextId)
      const trace = traceGroup[0];
      const childTraces = traceGroup.slice(1);
      return this.buildTraceNode(trace, parent, {
        childTraces
      });
    });
  }

  buildTraceNode(trace, parent, moreProps) {
    return this.buildNode(TraceNode, trace, parent, moreProps);
  }
}
