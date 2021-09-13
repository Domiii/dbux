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

  get app() {
    const { applicationId } = this.trace;
    return allApplications.getById(applicationId);
  }

  get dp() {
    return this.app.dataProvider;
  }
}