import allApplications from '@dbux/data/src/applications/allApplications';
import Trace from '@dbux/common/src/types/Trace';
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

  get app() {
    const { applicationId } = this.trace;
    return allApplications.getById(applicationId);
  }

  get dp() {
    return this.app.dataProvider;
  }
}