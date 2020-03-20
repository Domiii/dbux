import { newLogger } from 'dbux-common/src/log/logger';

export default class Collection<T> {
  /**
   * NOTE: collection ids can be 0
   */
  _id : number;
  _all : T[] = [];

  name : string;
  dp : DataProvider;

  constructor(name, dp) {
    this.log = newLogger(`${name} (Col)`);
    this.name = name;
    this.dp = dp;

    this._id = dp.versions.length; // dp.versions[_id] = 1
    dp.versions.push(1);
  }

  // ###########################################################################
  // Writes
  // ###########################################################################

  add(entries : T[]) {
    if (!this._all.length && entries[0] !== null) {
      // pad with a `null`, if necessary
      this._all.push(null);
    }
    this._all.push(...entries);
  }

  postAdd(entries: T[]) {
    // default: do nothing
  }

  // ###########################################################################
  // Reads
  // ###########################################################################
  
  get size() : number {
    return this._all.length - 1;
  }

  get all() {
    return this._all;
  }

  getAll() : T[] {
    return this._all;
  }

  getById(id : number) : T {
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