import { newLogger } from 'dbux-common/src/log/logger';
import DataEntry from 'dbux-common/src/core/data/DataEntry';
import DataProvider from './DataProvider';

export default class Collection<T> {
  /**
   * NOTE: collection ids can be 0
   */
  _id : number;
  _all : T[] = [null];

  name : string;
  dp : DataProvider;

  constructor(name, dp) {
    this.log = newLogger(`${name} (Col)`);
    this.name = name;
    this.dp = dp;

    this._id = dp.versions.length;
    dp.versions.push(1);
  }

  // ###########################################################################
  // Writes
  // ###########################################################################

  add(entries : T[]) {
    this._all.push(...entries);
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

  find(cb) {
    const {all} = this;
    for (let i = 1; i < all.length; ++i) {
      const entry = all[i];
      if (cb(entry)) {
        return entry;
      }
    }
    return undefined;
  }
}