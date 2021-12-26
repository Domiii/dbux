// import DoesNotExist from './DoesNotExist';
import CachedQuery from './CachedQuery';


/**
 * @typedef {import('../DataProviderBase').default} DataProviderBase
 */

const ClearCacheDelay = 10000;

/**
 * This is a {@link CachedQuery} that can be subscribed to.
 * Starts working once subscribed, at which point it registers data event handlers with the dependent collections.
 * Once all subscribers have unsubscribed, it stops listening on events and clears itself.
 * Unlike, {@link CachedQuery}, `executeQuery` does not perform the actual work. Instead, the work is done in event handlers.
 * 
 * This is used if:
 *  (i) a query result might change with incoming data, or if 
 * (ii) querying "all data points" of a collection (which by definition, also changes with new incoming data).
 */
export default class SubscribableQuery extends CachedQuery {
  /**
   * @type {number}
   */
  _enabled = 0;

  _unsubscribeCb;
  _hydrated = 0;

  // _nUncommited = 0;
  // _uncommitedData = null;

  get isEnabled() {
    return !!this._enabled;
  }

  get isHydrated() {
    return !!this._hydrated;
  }

  /** ###########################################################################
   * {@link #subscribe}
   * ##########################################################################*/

  /**
   * @param {function?} cb NYI: Optional callback will be invoked when data is updated
   */
  subscribe() {
    ++this._enabled;

    if (this._enabled <= 1) {
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

    let subscribed = true;
    return () => {
      if (subscribed) {
        this._unsubscribe();
        subscribed = false;
      }
    };
  }

  /** ###########################################################################
   * abstract/virtual interface methods
   * ##########################################################################*/

  /**
   * @virtual
   */
  executeQuery(dp, args) {
    if (!this._enabled) {
      // cold start
      // this.turnOn();
      throw new Error(`Must subscribe before using query: ${this}`);
    }

    // things are always up to date while enabled
    return this.lookup(args);
  }

  /**
   * Cold start: put everything in cache.
   * Default implementation: call all `on` handlers with all data.
   * @virtual
   */
  hydrateCache(dp) {
    for (const collectionName of this.cfg.collectionNames) {
      const data = dp.collections[collectionName].getAllActual();
      this._handleCollectionUpdate(collectionName, data);
    }
    ++this._hydrated;
    // throw new Error(`abstract method not implemented: ${this}.hydrateCache`);
  }

  clearCache() {
    super.clearCache();
    --this._hydrated;

    this.handleClearCache?.();
  }

  /** ###########################################################################
   * internal methods
   * ##########################################################################*/

  _unsubscribe = () => {
    --this._enabled;

    if (this._enabled <= 0) {
      setTimeout(() => {
        // only clear cache if unused for a while 
        if (this._enabled <= 0) {
          this.clearCache();
          this._unsubscribeCb?.();
          this._unsubscribeCb = null;
        }
      }, ClearCacheDelay);
    }
  }

  // // (future-work) hackfix "batching": the idea was that multiple collections might be updated at once, but 
  // //   it calls `handleNewData` individually, if we did not buffer it like this.
  // //   However, the "batching" approach can also go wrong, if data of different collections update at different frequencies.
  // // 
  // //   -> for now, we only have singular dependent collections, thus this is future work.
  // _handleCollectionUpdate(collectionName, newData) {
  //   ++this._nUncommited;
  //   if (!this._uncommitedData) {
  //     this._uncommitedData = {};
  //   }

  //   this._uncommitedData[collectionName] = newData;

  //   if (this._nUncommited === this.cfg.collectionNames.length) {
  //     // commit!
  //     if (this.handleNewData) {
  //       this.handleNewData(this._uncommitedData);
  //     }

  //     // reset
  //     this._uncommitedData = null;
  //     this._nUncommited = 0;
  //   }
  // }

  _handleCollectionUpdate(collectionName, newData) {
    if (!newData[0]) {
      // this might happen, usually only in case of initial data
      newData = newData.slice(1);
    }
    if (this.on?.[collectionName]) {
      this.on[collectionName].call(this, newData);
    }
  }
}