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
    const contexts = dp.collections.executionContexts.getAll();
    this._updateStats(contexts);
  }

  handleNewData(dataByCollection) {
    const contexts = dataByCollection.executionContexts;
    this._updateStats(contexts);
  }

  _updateStats(contexts) {
    // DFS + post-order sums
    const { dp } = this;
    dp.util.traverseDfs(dp, contexts, null, (context, children, prev) => {
      const stats = this._cache.get(context.contextId) || new ContextStats();
      stats.nTreeContexts = children.reduce((a, child) => a + , 1);
    });
  }
}