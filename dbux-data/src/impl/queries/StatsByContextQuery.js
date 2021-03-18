import IncrementalQuery from '../../queries/IncrementalQuery';
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
}

export default class StatsByContextQuery extends IncrementalQuery {
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

  /**
   * @param {RuntimeDataProvider} dp
   */
  hydrateCache(dp) {
    const contexts = dp.collections.executionContexts.getAll().slice(1);
    this._updateStats(contexts);
  }

  handleNewData(dataByCollection) {
    if (!dataByCollection.executionContexts) {
      return;
    }
    let contexts = dataByCollection.executionContexts;
    if (!contexts[0]) {
      contexts = contexts.slice(1);
    }
    this._updateStats(contexts);
  }

  /**
   * TODO: properly handle async contexts, whose stats can change over time.
   */
  _updateStats(contexts) {
    // DFS + post-order sums
    const { dp } = this;
    dp.util.traverseDfs(contexts,
      (dfs, context, children) => {
        const { contextId } = context;
        const stats = this._cache.get(contextId) || new ContextStats();
        const ownSet = new Set();

        // add own staticContextId to set
        const staticContextId = dp.util.getContextStaticContextId(contextId);
        ownSet.add(staticContextId);
        stats.nTreeContexts = 1;

        for (const child of children) {
          const childSet = dfs(child);

          // add childSet to ownSet
          childSet.forEach(ownSet.add, ownSet);
          stats.nTreeContexts += this.getContextNTreeContexts(child.contextId);
        }
        stats.nTreeStaticContexts = ownSet.size;

        this.storeByKey(contextId, stats);

        return ownSet;
      }
    );
  }
}