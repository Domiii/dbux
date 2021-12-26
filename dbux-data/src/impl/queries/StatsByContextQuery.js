import SubscribableQuery from '../../queries/SubscribableQuery';
import RuntimeDataProvider from '../../RuntimeDataProvider';

class ContextStats {
  /**
   * Amount of contexts in context, plus it's entire sub-tree.
   * @type {number}
   */
  nTreeContexts = 0;

  /**
   * Amount of referenced staticContexts in context, plus it's entire sub-tree.
   * @type {number}
   */
  nTreeStaticContexts = 0;

  /**
   * Amount of file called in context, plus it's entire sub-tree.?
   * @type {number}
   */
  nTreeFileCalled = 0;
}

export default class StatsByContextQuery extends SubscribableQuery {
  constructor() {
    super('statsByContext', {
      collectionNames: ['executionContexts']
    });
  }

  getContextNTreeContexts(contextId) {
    return this._cache.get(contextId)?.nTreeContexts || 0;
  }

  getContextNTreeStaticContexts(contextId) {
    return this._cache.get(contextId)?.nTreeStaticContexts || 0;
  }

  /** ###########################################################################
   * Interface implementation
   * ##########################################################################*/

  /**
   * future-work: also properly handle async contexts (their stats can change over time)
   */
  on = {
    executionContexts(contexts) {
      // DFS + post-order sums
      const { dp } = this;
      dp.util.traverseDfs(contexts,
        (dfs, context, children) => {
          const { contextId } = context;
          const stats = this._cache.get(contextId) || new ContextStats();

          const staticContextSet = new Set();
          const programIdSet = new Set();

          const staticContextId = dp.util.getContextStaticContextId(contextId);
          staticContextSet.add(staticContextId);
          stats.nTreeContexts = 1;

          const staticContextProgramId = dp.util.getContextStaticContext(contextId)?.programId;
          programIdSet.add(staticContextProgramId);

          for (const child of children) {
            const childSet = dfs(child);

            // add childSet to staticContextSet
            childSet.staticContextSet.forEach(staticContextSet.add, staticContextSet);
            childSet.programIdSet.forEach(programIdSet.add, programIdSet);

            stats.nTreeContexts += this.getContextNTreeContexts(child.contextId);
          }
          stats.nTreeStaticContexts = staticContextSet.size;
          stats.nTreeFileCalled = programIdSet.size;

          this.storeByKey(contextId, stats);

          const statsSet = { staticContextSet, programIdSet };

          return statsSet;
        }
      );
    }
  };
}
