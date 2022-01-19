import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection/index';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import { SelectorType } from './controllers/ContextNodeManager';

/** @typedef {import('./controllers/ContextNodeManager').default} ContextNodeManager */

const Verbose = false;

const UserActionTypeByMode = {
  [SearchMode.ByContext]: UserActionType.CallGraphSearchContexts,
  [SearchMode.ByTrace]: UserActionType.CallGraphSearchTraces,
  [SearchMode.ByValue]: UserActionType.CallGraphSearchValues,
};

const SearchMethodByMode = {
  [SearchMode.None]: null,
  [SearchMode.ByContext]: SelectorType.SearchContext,
  [SearchMode.ByTrace]: SelectorType.SearchTrace,
  [SearchMode.ByValue]: SelectorType.SearchValue,
};

class SearchBar extends HostComponentEndpoint {
  init() {
    this.state.mode = this.searchController.mode;
    this.state.searchTerm = this.searchController.searchTerm;

    this.searchController.onSearchModeChanged((mode) => {
      this.setState({ mode });
      this.search(this.state.searchTerm);
      this.parent.toolbar.forceUpdate();
    });

    this.searchController.onSearch(this.handleSearch);
  }


  get searchController() {
    return this.componentManager.externals.searchController;
  }

  /**
   * @return {ContextNodeManager}
   */
  get contextNodeManager() {
    return this.context.graphDocument.syncGraphContainer.graph.controllers.getComponent('ContextNodeManager');
  }

  selectContextByIndex(index) {
    const context = this.searchController.contexts[index];
    const dp = allApplications.getById(context.applicationId).dataProvider;
    const trace = dp.util.getFirstTraceOfContext(context.contextId);
    traceSelection.selectTrace(trace);
  }

  setSearchMode = (mode) => {
    Verbose && this.logger.log(`.setSearchMode() with mode=${mode}`);
    this.searchController.setSearchMode(mode);
  }

  search = (searchTerm) => {
    Verbose && this.logger.log(`.search() with searchTerm=${searchTerm}`);

    if (searchTerm) {
      const searchActionType = UserActionTypeByMode[this.state.mode];
      this.componentManager.externals.emitCallGraphAction(searchActionType, { searchTerm: searchTerm });
    }

    this.searchController.search(searchTerm);
  }

  handleSearch = (matches, searchTerm) => {
    const { contexts } = this.searchController;
    // highlight in callgraph
    const selector = searchTerm ? { searchTerm } : null;
    // TODO: use searchController's result instead of search again
    this.contextNodeManager.highlight(SearchMethodByMode[this.state.mode], selector, false);
    // this.matches = this.contextNodeManager.highlight(SearchMethodByMode[this.state.mode], selector);

    let index = -1;
    if (contexts.length) {
      index = 0;
      this.selectContextByIndex(index);
    }
    this.setState({
      searchTerm,
      index,
      count: contexts.length,
    });
  }

  public = {
    previous: () => {
      const index = (this.state.index - 1 + this.searchController.contexts.length) % this.searchController.contexts.length;
      this.selectContextByIndex(index);
      this.setState({ index });
    },
    next: () => {
      const index = (this.state.index + 1) % this.searchController.contexts.length;
      this.selectContextByIndex(index);
      this.setState({ index });
    },
    search: this.search,
    setSearchMode: this.setSearchMode
  }
}

export default SearchBar;