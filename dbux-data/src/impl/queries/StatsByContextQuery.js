import SubscribableQuery from '../../queries/SubscribableQuery';


export class ContextStats {
  /**
   * 
   * @param  {...ContextStats} stats 
   */
  static merge(...stats) {
    const newStats = new ContextStats();

    for (const s of stats) {
      newStats.nTreeContexts += s.nTreeContexts;
      newStats.nTreeTraces += s.nTreeTraces;
      
      s._staticContextIds.forEach(newStats._staticContextIds.add, newStats._staticContextIds);
      s._programIds.forEach(newStats._programIds.add, newStats._programIds);
      s._packageNames.forEach(newStats._packageNames.add, newStats._packageNames);
    }

    return newStats;
  }

  /**
   * Amount of contexts in context, plus it's entire sub-tree.
   * @type {number}
   */
  nTreeContexts = 0;

  /**
   * Amount of traces in context, plus it's entire sub-tree.
   * @type {number}
   */
  nTreeTraces = 0;

  /**
   * Amount of referenced staticContexts in context, plus it's entire sub-tree.
   * @type {number}
   */
  get nTreeStaticContexts() {
    return this._staticContextIds.size;
  }

  /**
   * Amount of file called in context, plus it's entire sub-tree.?
   * @type {number}
   */
  get nTreeFileCalled() {
    return this._programIds.size;
  }

  /**
   * Amount of packages in context, plus it's entire sub-tree.
   * @type {number}
   */
  get nTreePackages() {
    return this._packageNames.size;
  }

  /**
   * @type {Set<number>}
   */
  _staticContextIds = new Set();

  /**
   * @type {Set<number>}
   */
  _programIds = new Set();

  /**
   * @type {Set<number>}
   */
  _packageNames = new Set();
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
    const allStats = contextIds.map((contextId) => this._cache.get(contextId));
    return ContextStats.merge(...allStats);
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

          const staticContextIds = stats._staticContextIds;
          const programIds = stats._programIds;
          const packageNames = stats._packageNames;

          stats.nTreeContexts = 1;
          const childTraces = dp.indexes.traces.byContext.get(contextId);
          stats.nTreeTraces = childTraces?.length || 0;

          const staticContextId = dp.util.getContextStaticContextId(contextId);
          staticContextIds.add(staticContextId);
          const staticContextProgramId = dp.util.getContextStaticContext(contextId)?.programId;
          programIds.add(staticContextProgramId);
          const packageName = dp.util.getContextPackageName(contextId);
          packageNames.add(packageName);

          for (const child of children) {
            const childSets = dfs(child);

            // add childSet to staticContextSet
            childSets.staticContextIdSet.forEach(staticContextIds.add, staticContextIds);
            childSets.programIdSet.forEach(programIds.add, programIds);
            childSets.packageNameSet.forEach(packageNames.add, packageNames);

            stats.nTreeContexts += this.getContextNTreeContexts(child.contextId);
            stats.nTreeTraces += this.getContextNTreeTraces(child.contextId);
          }
          // data are directly added into the set
          // stats._staticContextIds = staticContextIds;
          // stats._programIds = programIds;
          // stats._packageNames = packageNames;

          this.storeByKey(contextId, stats);

          const sets = { staticContextIdSet: staticContextIds, programIdSet: programIds, packageNameSet: packageNames };
          return sets;
        }
      );
    }
  };
}
