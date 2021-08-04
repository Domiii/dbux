import allApplications from '@dbux/data/src/applications/allApplications';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/**
 * @property {Trace} trace
 */
export default class TraceDetailNode extends BaseTreeViewNode {
  get trace() {
    return this.entry;
  }

  get dp() {
    const {
      applicationId
    } = this.trace;
    const application = allApplications.getApplication(applicationId);
    const { dataProvider: dp } = application;
    return dp;
  }
}