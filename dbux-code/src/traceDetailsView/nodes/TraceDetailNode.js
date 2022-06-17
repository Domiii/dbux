import allApplications from '@dbux/data/src/applications/allApplications';
import Trace from '@dbux/common/src/types/Trace';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import DataNode from '@dbux/common/src/types/DataNode';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/**
 * 
 */
export default class TraceDetailNode extends BaseTreeViewNode {
  /**
   * @type {Trace}
   */
  get trace() {
    return this.entry;
  }

  get traceId() {
    return this.entry.traceId;
  }

  get rootContextId() {
    return this.trace.rootContextId;
  }

  get valueRef() {
    return this.dp.util.getValueRefOfTrace(this.traceId);
  }

  /**
   * @type {DataNode[]}
   */
  get dataNodes() {
    return this.dp.indexes.dataNodes.byTrace.get(this.traceId) || EmptyArray;
  }

  get app() {
    const { trace } = this;
    // if (!trace) {
    //   return null;
    // }
    const { applicationId } = trace;
    return allApplications.getById(applicationId);
  }

  get dp() {
    return this.app.dataProvider;
  }
}