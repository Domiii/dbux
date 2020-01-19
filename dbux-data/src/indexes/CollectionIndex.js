import { newLogger } from 'dbux-common/src/log/logger';

export default class CollectionIndex<T> {
  name;
  _byKey: T[][] = [];

  constructor(collectionName, name) {
    this.collectionName = collectionName;
    this.name = name;
    this.log = newLogger(`${name} (Index)`);
  }

  addEntries(entries : T[]) {
    const { makeKey } = this;
    for (const entry of entries) {
      const key = makeKey(this.dp, entry);
      if (key === undefined) {
        this.log.warn(`makeKey returned undefined`);
      }
      const byKey = (this._byKey[name] = this._byKey[name] || []);

      const currentCount = byKey.length;
      // for optimization reasons, we are currently only accepting simple number indexes
      if (isNaN(key) || key < 0 || (key > 1e6 && key < byKey.length/2)) {
        this.log.error('invalid key for index (currently only dense number spaces are supported):', key);
        continue;
      }
      if (key >= currentCount) {
        for (let i = byKey.length; i <= key; ++i) {
          byKey[i] = null;
        }
      }
      byKey[key] = entry;
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