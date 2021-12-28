import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection/index';
import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
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
    this.state.mode = SearchMode.None;
  }

  /**
   * @return {ContextNodeManager}
   */
  get contextNodeManager() {
    return this.context.graphDocument.syncGraphContainer.graph.controllers.getComponent('ContextNodeManager');
  }

  setSearchMode(mode) {
    if (mode !== this.state.mode) {
      this.setState({ mode });
      this.search(this.state.searchTerm);
      Verbose && this.logger.log(`.setSearchMode() with mode=${mode}`);
    }
  }

  selectContext(context) {
    const dp = allApplications.getById(context.applicationId).dataProvider;
    const trace = dp.util.getFirstTraceOfContext(context.contextId);
    traceSelection.selectTrace(trace);
  }

  search = (searchTerm) => {
    Verbose && this.logger.log(`.search() with searchTerm=${searchTerm}`);

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
    search: this.search
  }
}

export default SearchBar;