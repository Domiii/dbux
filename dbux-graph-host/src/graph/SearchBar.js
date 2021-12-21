import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection/index';
import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import { SelectorType } from './controllers/ContextNodeManager';

/** @typedef {import('./controllers/ContextNodeManager').default} ContextNodeManager */

const UserActionTypeByMode = {
  [SearchMode.ByContext]: UserActionType.CallGraphSearchContexts,
  [SearchMode.ByTrace]: UserActionType.CallGraphSearchTraces,
  [SearchMode.ByValue]: UserActionType.CallGraphSearchValues,
};

const SearchMethodByMode = {
  [SearchMode.ByContext]: SelectorType.SearchContext,
  [SearchMode.ByTrace]: SelectorType.SearchTrace,
  [SearchMode.ByValue]: SelectorType.SearchValue,
};

class SearchBar extends HostComponentEndpoint {
  init() {
    this.state.mode = SearchMode.None;
  }

  /**
   * @return {ContextNodeManager}
   */
  get contextNodeManager() {
    return this.context.graphDocument.syncGraphContainer.graph.controllers.getComponent('ContextNodeManager');
  }

  setSearchMode(mode) {
    // TODO: search & highlight by ContextNodeManager

    if (mode !== this.mode) {
      this.setState({ mode });
    }
  }

  selectContext(context) {
    const dp = allApplications.getById(context.applicationId).dataProvider;
    const trace = dp.util.getFirstTraceOfContext(context.contextId);
    traceSelection.selectTrace(trace);
  }

  public = {
    previous: () => {
      const index = (this.state.index - 1 + this.matches.length) % this.matches.length;
      this.selectContext(this.matches[index]);
      this.setState({ index });
    },
    next: () => {
      const index = (this.state.index + 1) % this.matches.length;
      this.selectContext(this.matches[index]);
      this.setState({ index });
    },
    search: (searchTerm) => {
      if (this.state.mode === SearchMode.None) {
        this.logger.warn(`Called "SearchBar.search" when mode is None`);
        return;
      }

      if (searchTerm) {
        const searchActionType = UserActionTypeByMode[this.state.mode];
        this.componentManager.externals.emitCallGraphAction(searchActionType, { searchTerm: searchTerm });
      }

      const selector = searchTerm ? { searchTerm } : null;
      this.matches = this.contextNodeManager.highlight(SearchMethodByMode[this.state.mode], selector);
      let index = -1;
      if (this.matches.length) {
        index = 0;
        this.selectContext(this.matches[index]);
      }
      this.setState({
        searchTerm,
        index,
        count: this.matches.length,
      });
    }
  }
}

export default SearchBar;