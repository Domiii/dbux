import { newLogger } from '@dbux/common/src/log/logger';

/**
 * @typedef {import('./DataProviderBase').default} DataProviderBase
 */

/**
 * @template T
 */
export default class Collection {
  /**
   * NOTE: collection id can be 0
   * @type {number}
   */
  _id;
  /**
   * @type {T[]}
   */
  _all = [];

  /**
   * @type {string}
   */
  name;

  /**
   * @type {DataProviderBase}
   */
  dp;

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

  /**
   * @virtual
   * @param {T} entry 
   */
  handleAdd(entry) { }

  /**
   * @param {T[]} entries 
   */
  add(entries) {
    if (!this._all.length && entries[0] !== null) {
      // pad with a `null`, if necessary
      this._all.push(null);
    }

    // WARNING: cannot use push(...entries) for large `entries` array.
    // see: https://github.com/nodejs/node/issues/27732
    for (const entry of entries) {
      this.handleAdd(entry);
      this._all.push(entry);
    }
  }

  /**
   * Collections can use this to massage data after all data has been added, but before indexes have been processed. This will be executed only on the first time that data has been added.
   * @virtual
   * 
   * @param {T[]} entries
   */
  postAddRaw(entries) {}

  /**
   * Collections can use this to massage data after all data has been added, but before indexes have been processed. This will be executed everytime data has been added(even when deserialize).
   * @virtual
   * @param {T[]} entries
   */
  postAddProcessed(entries) {}

  // /**
  //  * Collections can use this to massage data after all data has been added, and after indexes have been processed.
  //  * @virtual
  //  */
  // postIndex(/* entries */) { }

  // ###########################################################################
  // Reads
  // ###########################################################################

  *[Symbol.iterator]() {
    for (let i = 1; i < this._all.length; ++i) {
      yield this._all[i];
    }
  }

  /**
   * @type {number}
   */
  get size() {
    // TODO: make this more consistent (currently, we are padding null only after first add)
    return this._all.length > 0 ? this._all.length - 1 : 0;
  }

  get all() {
    return this._all;
  }

  /**
   * @return {T[]}
   */
  getAll() {
    return this._all;
  }

  /**
   * @param {number} id
   * @return {T}
   */
  getById(id) {
    return this._all[id];
  }

  getLast() {
    if (!this._all.length) {
      return null;
    }
    return this._all[this._all.length - 1];
  }

  find(cb) {
    const { all } = this;
    for (let i = 1; i < all.length; ++i) {
      const entry = all[i];
      if (cb(entry)) {
        return entry;
      }
    }
    return undefined;
  }
}