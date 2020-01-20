import { newLogger } from 'dbux-common/src/log/logger';

export default class CollectionIndex<T> {
  name;
  _byKey: T[][] = [];

  constructor(collectionName, name) {
    this.collectionName = collectionName;
    this.name = name;
    this.log = newLogger(`${name} (Index)`);
  }

  addEntries(dp, entries : T[]) {
    const { makeKey } = this;
    for (const entry of entries) {
      const key = makeKey(dp, entry);
      if (key === undefined) {
        this.log.warn(`makeKey returned undefined`);
      }

      const currentCount = this._byKey.length;
      // for optimization reasons, we are currently only accepting simple number indexes
      if (isNaN(key) || key < 0 || (key > 1e6 && key < this._byKey.length/2)) {
        this.log.error('invalid key for index (currently only dense number spaces are supported):', key);
        continue;
      }
      if (key >= currentCount) {
        for (let i = this._byKey.length; i <= key; ++i) {
          this._byKey[i] = null;
        }
      }

      const byKey = (this._byKey[key] = this._byKey[key] || []);
      byKey.push(entry);
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