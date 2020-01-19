import Index from './Index';
import { newLogger } from 'dbux-common/src/log/logger';
import DataEntry from 'dbux-common/src/core/data/DataEntry';
import DataProvider from './DataProvider';

export default class Collection<T> {
  name : string;
  _all : T[] = [null];
  // indexes : { [string]: Index<T> } = {};
  dp : DataProvider;

  constructor(name, dp) {
    this.log = newLogger(`${name} (Col)`);
    this.name = name;
    this.dp = dp;
  }

  // ###########################################################################
  // Writes
  // ###########################################################################

  addIndex(index : Index<T>) {
    this.indexes[index.name] = index;
  }

  add(entries : T[]) {
    this._all.push(...entries);
  }

  /**
   * Will be called after all entries have been added, and before event listeners are notified.
   * @private
   */
  _processNewEntries(entries : T[]) {
    // process indexes
    for (const name in this.indexes) {
      const index = this.indexes[name];
      index.addEntries(entries);
    }
  }

  // ###########################################################################
  // Reads
  // ###########################################################################

  getAll() : T[] {
    return this._all;
  }

  getById(id : number) {
    return this._all[id];
  }
}