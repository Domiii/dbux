import { newLogger } from '@dbux/common/src/log/logger';

/**
 * @typedef {import('./DataProviderBase').default} DataProviderBase
 * @typedef {import('./RuntimeDataProvider').default} RuntimeDataProvider
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
   * @type {DataProviderBase & RuntimeDataProvider}
   */
  dp;

  /**
   * NOTE: some collections are populated entirely by dbux-data, and not by runtime.
   *    These collections (for now) have some small differences in the way they are populated:
   * 
   * 1. no `entry._id`
   * 2. no first `null` element
   */
  hasNoRuntime;

  constructor(name, dp, hasNoRuntime = false) {
    if (!name || !dp) {
      throw new Error(`Collection did not provide name and dp to ctor - ${this.constructor.name}`);
    }
    this.hasNoRuntime = hasNoRuntime;
    this.logger = newLogger(`${name}`);
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
    // future-work: `concat` can be faster than for loop.
    // see: https://github.com/nodejs/node/issues/27732
    for (const entry of entries) {
      this.addEntry(entry);
    }
  }

  addEntry(entry) {
    this.handleAdd(entry);
    if (!entry._id) {
      console.warn(`entry._id missing:`, entry);
      this._all.push(entry);
    }
    else {
      this._all[entry._id] = entry;
    }
  }

  /**
   * Collections can use this to massage data after all data has been added, but before indexes have been processed. This will be executed only on the first time that data has been added.
   * @virtual
   * @param {T[]} entries
   */
  postAddRaw(entries) { }

  /**
   * Collections can use this to massage data after all data has been added, but before indexes have been processed. This will be executed everytime data has been added(even when deserialize).
   * @virtual
   * @param {T[]} entries
   */
  postAddProcessed(entries) { }

  /**
   * Collections can use this to massage data after all data has been added, and after indexes have been processed. This will be executed only on the first time that data has been added.
   * @virtual
   * @param {T[]} entries
   */
  postIndexRaw(entries) { }

  /**
   * Collections can use this to massage data after all data has been added, and after indexes have been processed. This will be executed everytime data has been added(even when deserialize).
   * @virtual
   * @param {T[]} entries
   */
  postIndexProcessed(entries) { }

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
  
  _invalidId = false;

  /**
   * @param {number} id
   * @return {T}
   */
  getById(id) {
    let entry = this._all[id];
    if (entry && entry._id && entry._id !== id && !this._invalidId) {
      const idx = this._all.findIndex((e, i) => e && e._id !== i);
      const faultyEntry = this._all[idx];
      let recoverable = idx === faultyEntry._id - 1;

      if (recoverable) {
        this._all.splice(idx, 0, null); // pad with a single `null`
        entry = this._all[id];
        recoverable = entry._id && entry._id === id;
      }
      
      this._reportInvalidId(idx, faultyEntry, recoverable);

      if (!recoverable) {
        this._invalidId = true;
        return null;
      }
    }
    return entry;
  }

  _reportInvalidId(idx, faultyEntry, recoverable) {
    this.logger.error(`entry._id !== id (recoverable=${recoverable}) - First invalid entry is at #${idx}: ${JSON.stringify(faultyEntry)}`);
  }

  getAllActual(startId = 1) {
    return this._all.slice(startId);
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
  
  errorWrapMethod(methodName, ...args) {
    try {
      // build dynamic call expression tree
      this[methodName](...args);
    }
    catch (err) {
      this.logger.error(`${this.constructor.name}.${methodName}`, 'failed\n  ', err); //...args);
    }
  }


  /**
   * Cached `collectionNames`, used in `addEntryPostAdd`.
   */
  get _collectionNames() {
    Object.defineProperty(this, '_collectionNames', { value: [this.name] });
    return this._collectionNames;
  }

  addEntryPostAdd(entry) {
    this.addEntry(entry);

    // TODO: can we postpone `_postAdd` to run once per run instead?
    // populate indexes, trigger data dependencies etc.
    const allData = { [this.name]: [entry] };
    this.dp._postAdd(this._collectionNames, allData, true);

    // future-work: this could happen during another post-add event. Make sure, this won't bug out.
    this.dp._notifyData(this._collectionNames, allData);
  }
}