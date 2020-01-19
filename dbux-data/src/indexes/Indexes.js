import CollectionIndex from './CollectionIndex';

/**
 * Represents all indexes of a `DataProvider`
 */
export default class Indexes {
  _addIndex(index: CollectionIndex) {
    const indexes = this[index.collectionName] = (this[index.collectionName] || {});
    indexes[index.name] = index;
  }

  /**
   * Will be called after all entries have been added, and before event listeners are notified.
   * @private
   */
  _processNewEntries(collectionName, entries: []) {
    // process indexes
    const ofCollection = this[collectionName];
    for (const name in ofCollection) {
      const index = ofCollection[name];
      index.addEntries(entries);
    }
  }
}