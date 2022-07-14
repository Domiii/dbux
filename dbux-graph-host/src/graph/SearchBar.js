import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection/index';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import { SelectorType } from './controllers/ContextNodeManager';

/** @typedef {import('./controllers/ContextNodeManager').default} ContextNodeManager */

const Verbose = false;

class SearchBar extends HostComponentEndpoint {
  init() {
    this.state.mode = this.searchController.mode;
    this.state.searchTerm = this.searchController.searchTerm;

    this.addDisposable(
      this.searchController.onSearchModeChanged(this.handleSearchModeChanged),
      this.searchController.onSearch(this.handleSearch)
    );
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
    if (searchTerm) {
      Verbose && this.logger.log(`.search() with searchTerm=${searchTerm}`);
      this.searchController.search(searchTerm, true);
    }
    else {
      Verbose && this.logger.log(`clear search`);
      this.searchController.clearSearch();
    }
  }

  handleSearchModeChanged = (mode) => {
    this.setState({ mode });
    if (this.searchController.searchTerm) {
      this.search(this.searchController.searchTerm);
    }
    this.parent.toolbar.forceUpdate();
  }

  handleSearch = async () => {
    // NOTE: this can be super slow for large applications, so let's not do this for now.
    
    // const { searchController } = this;
    // const { contexts, searchTerm, mode } = searchController;

    // // highlight in callgraph
    // const selector = (mode !== SearchMode.None && searchTerm) ? { searchController } : null;
    // await this.contextNodeManager.highlight(SelectorType.Search, selector, false);

    // // select first match
    // let index = -1;
    // if (contexts.length) {
    //   index = 0;
    //   this.selectContextByIndex(index);
    // }
    // this.setState({
    //   searchTerm,
    //   index,
    //   count: contexts.length,
    // });
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