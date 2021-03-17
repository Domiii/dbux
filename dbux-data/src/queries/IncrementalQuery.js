// import DoesNotExist from './DoesNotExist';
import CachedQuery from './CachedQuery';


/**
 * @typedef {import('../DataProviderBase').default} DataProviderBase
 */

/**
 * IncrementalQuery needs `on` and `off` states.
 * While `on`, they need to listen to DP for new data events, so they can increment.
 * When `off`, there is no need for this.
 * 
 * This will be necessary for optimizing utilities such as `getContextStats` that 
 * incrementally depend on the entire sub-tree.
 * As of 3/2021, we don't yet render the asynchronous call graph. 
 * The synchronous call graph's sub-trees cannot change over time.
 * The asynchronous call graph however will require tracking (incremental) changes to the sub-tree over time.
 */
export default class IncrementalQuery extends CachedQuery {
  /**
   * @type {number}
   */
  isEnabled = 0;

  _unsubscribeCb;

  _nUncommited = 0;
  _uncommitedData = null;

  subscribe() {
    ++this.isEnabled;

    if (this.isEnabled <= 1) {
      // start listening on events
      const collectionCbs = Object.fromEntries(
        this.cfg.collectionNames.map(name => (
          [name, this._handleCollectionUpdate.bind(this, name)]
        ))
      );
      this._unsubscribeCb = this.dp._onMultiCollectionData(collectionCbs, 
        this.dp._dataEventListenersInternal);

      // cold start
      this.hydrateCache(this.dp);
    }
  }

  unsubscribe() {
    --this.isEnabled;

    if (this.isEnabled <= 0) {
      this._unsubscribeCb?.();
      this._unsubscribeCb = null;
      this.clearCache();
    }
  }

  performQuery(dp, args) {
    if (!this.isEnabled) {
      // cold start
      // this.turnOn();
      throw new Error(`Must subscribe before using: ${this}`);
    }

    // things are always up to date while enabled
    return this.lookup(args);
  }

  _handleCollectionUpdate(collectionName, newData) {
    ++this._nUncommited;
    if (!this._uncommitedData) {
      this._uncommitedData = {};
    }

    this._uncommitedData[collectionName] = newData;

    if (this._nUncommited === this.cfg.collectionNames.length) {
      // commit!
      this.handleNewData(this._uncommitedData);

      // reset
      this._uncommitedData = null;
      this._nUncommited = 0;
    }
  }
  
  /**
   * Cold start: put everything in cache.
   */
  hydrateCache(/* dp */) {
    throw new Error(`abstract method not implemented: ${this}.hydrateCache`);
  }

  /**
   * Incrementally update cached data, from given collection data.
   */
  handleNewData(/* dataByCollection */) {
    throw new Error(`abstract method not implemented: ${this}.handleNewData`);
  }
}