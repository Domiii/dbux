import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import NanoEvents from 'nanoevents';
import { emitUserAction } from '../userEvents';
import SearchTools from './SearchTools';

const SearchUserActionTypeByMode = {
  [SearchMode.ByContext]: UserActionType.SearchContexts,
  [SearchMode.ByTrace]: UserActionType.SearchTraces,
  [SearchMode.ByValue]: UserActionType.SearchValues,
};

class SearchController {
  /**
   * @type {[{applicationId: number, matches: any[]}]}
   */
  matches = EmptyArray;

  constructor() {
    this._emitter = new NanoEvents();
    this.mode = SearchMode.None;
    this.resetSearch();

    allApplications.selection.onApplicationsChanged(this.handleApplicationSelectionChanged);
  }

  /** ###########################################################################
   * public
   *  #########################################################################*/

  setSearchMode(mode) {
    if (this.mode !== mode) {
      this.mode = mode;
      this._notifySearchModeChanged();
      emitUserAction(UserActionType.SearchModeChanged, mode);
    }
  }

  search(searchTerm, fromUser = false) {
    this.searchTerm = searchTerm;
    if (this.mode === SearchMode.None) {
      this.matches = EmptyArray;
      this.contexts = EmptyArray;
    }
    else {
      emitUserAction(SearchUserActionTypeByMode[this.mode], { searchTerm });
      this.matches = SearchTools[this.mode].search(searchTerm);
      this.contexts = SearchTools[this.mode].getContexts(this.matches);
    }

    this._notifySearch(fromUser);

    return this.matches;
  }

  clearSearch(fromUser = false) {
    this.resetSearch();
    this._notifySearch(fromUser);
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

  resetSearch() {
    this.searchTerm = '';
    this.matches = EmptyArray;
    this.contexts = EmptyArray;
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

  _notifySearch(fromUser) {
    this._emitter.emit('search', this.matches, this.searchTerm, fromUser);
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