import EmptyArray from '@dbux/common/src/util/EmptyArray';
import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import NanoEvents from 'nanoevents';
import { SearchContext, SearchTrace, SearchValue } from './SearchHelper';

class SearchController {
  constructor() {
    this._emitter = new NanoEvents();
    this.mode = SearchMode.None;
    this.searchTerm = '';
    /**
     * @type {[{applicationId: number, matches: any[]}]}
     */
    this.matches = EmptyArray;
    this.contexts = EmptyArray;
    this.searchTools = {
      [SearchMode.ByContext]: new SearchContext(),
      [SearchMode.ByTrace]: new SearchTrace(),
      [SearchMode.ByValue]: new SearchValue()
    };
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
      this.matches = this.searchTools[this.mode].search(searchTerm);
      this.contexts = this.searchTools[this.mode].getContexts(this.matches);
    }

    this._notifySearch();

    return this.matches;
  }

  /**
   * Get context of a match result depending on current search mode
   */
  getContext(dp, match) {
    return this.searchTools[this.mode].getContext(dp, match);
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
}

const searchController = new SearchController();
export default searchController;