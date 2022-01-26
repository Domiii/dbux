import allApplications from '@dbux/data/src/applications/allApplications';
import SearchMode from '@dbux/graph-common/src/shared/SearchMode';

/** @typedef {import('@dbux/data/src/RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/ExecutionContext').default} ExecutionContext */
/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */
/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */

/**
 * @template T
 */
class SearchToolBase {
  /**
   * @param {string} searchTerm
   * @return {[{applicationId: number, matches: T[]}]}
   */
  search(searchTerm) {
    const matchesByApp = allApplications.selection.getAll()
      .map(({ dataProvider, applicationId }) => {
        return {
          applicationId,
          matches: this._search(dataProvider, searchTerm)
        };
      });
    return matchesByApp;
  }


  /**
   * @virtual
   * @param {RuntimeDataProvider} dp
   * @param {string} searchTerm
   * @return {T[]}
   */
  _search(dp, searchTerm) {
    throw new Error('abstract method not implemented');
  }

  /**
   * @virtual
   * @param {[{applicationId: number, matches: T[]}]} matchesByApp
   * @return {ExecutionContext[]}
   */
  getContexts(matchesByApp) {
    const contexts = new Set();
    for (const { applicationId, matches } of matchesByApp) {
      const dp = allApplications.getById(applicationId).dataProvider;
      for (const match of matches) {
        contexts.add(this.getContext(dp, match));
      }
    }

    return [...contexts];
  }

  /**
   * @virtual
   * @param {T[]} matches
   * @return {ExecutionContext[]}
   */
  getContext(dp, match) {
    throw new Error('abstract method not implemented');
  }
}

/**
 * @extends {SearchToolBase<ExecutionContext>}
 */
class SearchContext extends SearchToolBase {
  _search(dp, searchTerm) {
    return dp.util.searchContexts(searchTerm);
  }

  getContext(dp, context) {
    return context;
  }
}

/**
 * @extends {SearchToolBase<Trace>}
 */
class SearchTrace extends SearchToolBase {
  _search(dp, searchTerm) {
    return dp.util.searchTraces(searchTerm);
  }

  getContext(dp, trace) {
    return dp.collections.executionContexts.getById(trace.contextId);
  }
}

/**
 * @extends {SearchToolBase<DataNode>}
 */
class SearchValue extends SearchToolBase {
  _search(dp, searchTerm) {
    return dp.util.searchValues(searchTerm);
  }

  getContext(dp, dataNode) {
    const trace = dp.collections.traces.getById(dataNode.traceId);
    const context = dp.collections.executionContexts.getById(trace.contextId);
    return context;
  }
}

const SearchTools = {
  [SearchMode.ByContext]: new SearchContext(),
  [SearchMode.ByTrace]: new SearchTrace(),
  [SearchMode.ByValue]: new SearchValue(),
};

export default SearchTools;