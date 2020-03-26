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

  /**
   * Collections can use this to massage data after all data has been added, but before indexes have been processed.
   * @virtual
   */
  postAdd(entries: T[]) { }

  /**
   * Collections can use this to massage data after all data has been added, and after indexes have been processed.
   * @virtual
   */
  postIndex(entries) { }

  // ###########################################################################
  // Reads
  // ###########################################################################

  * [Symbol.iterator]() {
    for (let i = 1; i < this._all.length; ++i) {
      yield this._all[i];
    }
  }
  
  get size() : number {
    // TODO: make this more consistent (currently, we are padding null only after first add)
    return this._all.length > 0 ? this._all.length - 1 : 0;
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