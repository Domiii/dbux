import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import NanoEvents from 'nanoevents';
import SearchTools from './SearchTools';

class SearchController {
  /**
   * @type {[{applicationId: number, matches: any[]}]}
   */
  matches = EmptyArray;

  constructor() {
    this._emitter = new NanoEvents();
    this.reset();

    allApplications.selection.onApplicationsChanged(this.handleApplicationSelectionChanged);
  }

  /** ###########################################################################
   * public
   *  #########################################################################*/

  setSearchMode(mode) {
    if (this.mode !== mode) {
      this.mode = mode;
      this._notifySearchModeChanged();
    }
  }

  search(searchTerm) {
    this.searchTerm = searchTerm;
    if (this.mode === SearchMode.None) {
      this.matches = EmptyArray;
      this.contexts = EmptyArray;
    }
    else {
      this.matches = SearchTools[this.mode].search(searchTerm);
      this.contexts = SearchTools[this.mode].getContexts(this.matches);
    }

    this._notifySearch();

    return this.matches;
  }

  nextSearchMode() {
    let nextMode = SearchMode.nextValue(this.mode);
    if (nextMode === SearchMode.None) {
      nextMode = SearchMode.nextValue(nextMode);
    }
    this.setSearchMode(nextMode);
  }

  /**
   * Get context of a match result depending on current search mode
   */
  getContext(dp, match) {
    return SearchTools[this.mode].getContext(dp, match);
  }

  clearSearch() {
    this.searchTerm = '';
    this.matches = EmptyArray;
    this.contexts = EmptyArray;
  }

  reset() {
    this.mode = SearchMode.None;
    this.clearSearch();
  }

  /** ###########################################################################
   * event handling
   *  #########################################################################*/

  _notifySearchModeChanged() {
    this._emitter.emit('modeChanged', this.mode);
  }

  onSearchModeChanged(cb) {
    return this._emitter.on('modeChanged', cb);
  }

  _notifySearch() {
    this._emitter.emit('search', this.matches, this.searchTerm);
  }

  onSearch(cb) {
    return this._emitter.on('search', cb);
  }

  handleApplicationSelectionChanged = () => {
    this.search(this.searchTerm);
  }
}

const searchController = new SearchController();
export default searchController;