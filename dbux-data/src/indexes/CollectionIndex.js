import { newLogger } from 'dbux-common/src/log/logger';

export default class CollectionIndex<T> {
  name;
  _byKey: T[][] = [];

  constructor(collectionName, indexName) {
    this.collectionName = collectionName;
    this.name = indexName;
    this.log = newLogger(`${indexName} (Index)`);
  }

  addEntries(dp, entries : T[]) {
    for (const entry of entries) {
      const key = this.makeKey(dp, entry);
      if (key === undefined) {
        this.log.error(`makeKey returned undefined`);
      }

      // for optimization reasons, we are currently only accepting simple number indexes
      const currentCount = this._byKey.length;
      if (isNaN(key) || key < 0 || (key > 1e6 && key < this._byKey.length/2)) {
        this.log.error('invalid key for index (currently only dense number spaces are supported):', key);
        continue;
      }
      if (key >= currentCount) {
        for (let i = this._byKey.length; i <= key; ++i) {
          this._byKey.push(null);
        }
      }

      const ofKey = (this._byKey[key] = this._byKey[key] || []);
      ofKey.push(entry);
    }
  }

  get(key : number) : T[] {
    return this._byKey[key] || null;
  }

  /**
   * Returns a unique key (number) for given entry.
   */
  makeKey(dp, entry : T) : number {
    throw new Error(`abstract method not implemented: ${this.constructor.name}.makeKey`);
  }

}