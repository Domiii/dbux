import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';

/**
 * @template {T}
 */
export default class CollectionIndex {
  /**
   * @type {DataProvider}
   */
  dp;
  name;

  /**
   * @type {T[][]}
   */
  _byKey;

  constructor(collectionName, indexName, { addOnNewData = true, stringKey = false } = EmptyObject) {
    this.collectionName = collectionName;
    this.name = indexName;
    this.log = newLogger(`${indexName} (Index)`);
    this.addOnNewData = addOnNewData;
    this.stringKey = stringKey;
  }

  _init(dp) {
    this.dp = dp;
    if (this.stringKey) {
      this._byKey = {};
    }
    else {
      this._byKey = [];
    }
  }

  /**
   * @param {number} key 
   * @return {T[]}
   */
  get(key) {
    return this._byKey[key];
  }

  /**
   * @param {T[]} entries 
   */
  addEntries(entries) {
    for (const entry of entries) {
      this.addEntry(entry);
    }
  }

  /**
   * @param {T} entry 
   */
  addEntry(entry) {
    const key = this.makeKey(this.dp, entry);
    if (key === undefined) {
      debugger;
      this.log.error('makeKey returned undefined');
      return;
    }
    if (key === false) {
      // entry is filtered out; not part of this index
      return;
    }

    const ofKey = (this._byKey[key] = this._byKey[key] || []);
    this.beforeAdd?.(ofKey, entry);
    ofKey.push(entry);

    // sanity check
    // if (ofKey.includes(undefined)) {
    //   this.log.error('Index contains undefined values', key, entry, ofKey);
    // }
  }

  addEntryById(id) {
    const entry = this.dp.collections[this.collectionName].getById(id);
    this.addEntry(entry);
  }

  /** 
   * Returns a unique key (number) for given entry.
   * @param {DataProvider} dp
   * @param {T} entry 
   */
  makeKey(/* dp, entry */) {
    throw new Error(`abstract method not implemented: ${this.constructor.name}.makeKey`);
  }
}