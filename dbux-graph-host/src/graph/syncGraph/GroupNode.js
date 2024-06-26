import ContextNode from './ContextNode';

// TODO: don't have `Group` depend on `Hole`-related stuff
/** @typedef { import("../SyncGraphBase").ContextNodeHole } ContextNodeHole */
/** @typedef { import("../SyncGraphBase").ContextNodeHoleClient } ContextNodeHoleClient */

/**
 * TODO: Ideally, `GroupNode` does not extend `ContextNode`
 */
export default class GroupNode extends ContextNode {
  /**
   * @type {ContextNodeHole}
   */
  get group() {
    return this.hostOnlyState.group;
  }

  /**
   * Returns all contexts at the top of this group (not necessarily CGRs).
   * They (probably?) should all be siblings of the same parent.
   */
  get rootContextsOfGroup() {
    return this.group.contexts.filter(TODO);
  }

  get allContextStats() {
    return this.dp.queryImpl.statsByContext.getCombinedStats(this.group.contextIds);
  }
}