import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

/** @typedef {import('@dbux/common/src/core/data/Trace').default} Trace */

/**
 * @property {Trace} trace
 */
export default class TraceDetailNode extends BaseTreeViewNode {
  get trace() {
    return this.entry;
  }
}