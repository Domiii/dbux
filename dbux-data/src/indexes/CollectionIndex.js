import { newLogger } from 'dbux-common/src/log/logger';
import DataProvider from '../DataProvider';

export default class CollectionIndex<T> {
  dp: DataProvider;
  name;
  _byKey: T[][] = [];

  constructor(collectionName, indexName) {
    this.collectionName = collectionName;
    this.name = indexName;
    this.log = newLogger(`${indexName} (Index)`);
  }

  _init(dp) {
    this.dp = dp;
  }

  get(key: number): T[] {
    return this._byKey[key];
  }

  addEntries(entries : T[]) {
    for (const entry of entries) {
      this.addEntry(entry);
    }
  }

  addEntry(entry : T) {
    const key = this.makeKey(this.dp, entry);
    if (key === undefined) {
      this.log.error('makeKey returned undefined');
      return;
    }
    if (key === false) {
      // entry is filtered out; not part of this index
      return;
    }

    // for optimization reasons, we are currently only accepting simple number indexes
    const currentCount = this._byKey.length;
    if (!Number.isInteger(key) || key < 0 || (key > 1e6 && key < currentCount / 2)) {
      this.log.error('invalid key for index (currently only dense number spaces are supported):', key);
    }
    else {
      const ofKey = (this._byKey[key] = this._byKey[key] || []);
      ofKey.push(entry);
      if (ofKey.includes(undefined)) {
        this.log.error('Index contains undefined values', key, entry, ofKey);
      }
    }
  }

  addEntryById(id) {
    const entry = this.dp.collections[this.collectionName].getById(id);
    this.addEntry(entry);
  }

  /**
   * Returns a unique key (number) for given entry.
   */
  makeKey(dp, entry : T) : number | bool {
    throw new Error(`abstract method not implemented: ${this.constructor.name}.makeKey`);
  }

}