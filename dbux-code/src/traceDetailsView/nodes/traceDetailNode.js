import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/**
 * @property {Trace} trace
 */
export default class TraceDetailNode extends BaseTreeViewNode {
  get trace() {
    return this.entry;
  }
}