import SubscribableQuery from '../../queries/SubscribableQuery';


export class ContextStats {
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

  /**
   * Amount of traces in context, plus it's entire sub-tree.
   * @type {number}
   */
  nTreeTraces = 0;
  
  /**
   * Amount of packages in context, plus it's entire sub-tree.
   * @type {number}
   */
  nTreePackages = 0;
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

  getContextNTreeTraces(contextId) {
    return this._cache.get(contextId)?.nTreeTraces || 0;
  }

  /**
   * @param {number[]} contextIds 
   */
  getCombinedStats(contextIds) {
    let stats = this._cache.get(contextIds[0]);
    const keys = Object.keys(stats);
    if (contextIds.length > 1) {
      stats = { ...stats };
      for (let i = 1; i < contextIds.length; ++i) {
        const next = this._cache.get(contextIds[i]);
        for (const key of keys) {
          stats[key] += next[key];
        }
      }
    }
    return stats;
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

          const staticContexts = new Set();
          const programIds = new Set();
          const packageNames = new Set();

          const staticContextId = dp.util.getContextStaticContextId(contextId);
          staticContexts.add(staticContextId);
          stats.nTreeContexts = 1;
          const childTraces = dp.indexes.traces.byContext.get(contextId);
          stats.nTreeTraces = childTraces?.length || 0;

          const staticContextProgramId = dp.util.getContextStaticContext(contextId)?.programId;
          programIds.add(staticContextProgramId);
          packageNames.add(dp.util.getContextPackageName(contextId));

          for (const child of children) {
            const childSets = dfs(child);

            // add childSet to staticContextSet
            childSets.staticContextSet.forEach(staticContexts.add, staticContexts);
            childSets.programIdSet.forEach(programIds.add, programIds);
            childSets.packageNameSet.forEach(packageNames.add, packageNames);

            stats.nTreeContexts += this.getContextNTreeContexts(child.contextId);
            stats.nTreeTraces += this.getContextNTreeTraces(child.contextId);
          }
          stats.nTreeStaticContexts = staticContexts.size;
          stats.nTreeFileCalled = programIds.size;
          stats.nTreePackages = packageNames.size;

          this.storeByKey(contextId, stats);

          const sets = { staticContextSet: staticContexts, programIdSet: programIds, packageNameSet: packageNames };
          return sets;
        }
      );
    }
  };
}
