import isObject from 'lodash/isObject';
import DoesNotExist from './DoesNotExist';
import Query from './Query';

function makeKey(args) {
  // if (args.length === 1 && !isObject(args[0])) {
  //   return args[0];
  // }
  if (!isObject(args)) {
    return args;
  }
  // TODO: improve efficiency of this!
  return JSON.stringify(args);
}

// ###########################################################################
// CachedQuery
// ###########################################################################

export class CachedQueryConfig {
  collectionNames;
  collectionIds;
  /**
   * NOTE: currently unused
   * @type {boolean}
   */
  onlyCacheExisting = false;

  /**
   * Whether to clear cache when data changes.
   * 
   * @type {boolean}
   */
  invalidateOnUpdate = true;
}

/**
 * This type of query caches it's results.
 * Still requires implementing the `Query.execute` function.
 */
export default class CachedQuery extends Query {
  _cache = new Map();
  _lastVersions;

  // /**
  //  * @type {CachedQueryConfig}
  //  */
  // cfg;

  /** ###########################################################################
   * public methods
   * ##########################################################################*/

  has(key) {
    return this._cache.has(key);
  }

  lookup(args) {
    const key = makeKey(args);
    return this._cache.get(key);
  }

  storeByKey(args, result) {
    const key = makeKey(args);
    this._cache.set(key, result);
  }

  clearCache() {
    this._cache.clear();
  }

  /** ###########################################################################
   * abstract/virtual interface methods
   * ##########################################################################*/

  executeQuery(dp, args) {
    // check version
    if (this._updateVersions(dp.versions) && this.cfg.invalidateOnUpdate) {
      // clear cache if outdated
      this.clearCache();
    }

    let result = this.lookup(args);

    if (result === DoesNotExist) {
      result = this._getOrUpdateCachedEntry(dp, args);
    }
    return result;
  }

  /** ###########################################################################
   * private methods
   * ##########################################################################*/


  _init(dp) {
    super._init(dp);

    // ########################################
    // fix config
    // ########################################
    let {
      collectionNames,
      onlyCacheExisting = false,
      invalidateOnUpdate = true
    } = this.cfg;

    let collectionIds;
    if (collectionNames) {
      // depends only on limited set of collections
      collectionIds = collectionNames.map(name => {
        dp.validateCollectionName(name);
        return dp.collections[name]._id;
      });
    }
    else {
      // depends on all collections
      const allCollections = Object.values(dp.collections);
      collectionIds = allCollections.map(c => c._id);
      collectionNames = allCollections.map(c => c.name);
    }

    // NOTE: sorted versions makes it more cache-efficient when looping over the version arrays
    collectionIds.sort((a, b) => a - b);

    this.cfg = Object.assign(this.cfg, {
      collectionNames,
      collectionIds,
      onlyCacheExisting,
      invalidateOnUpdate
    });

    // ########################################
    // // copy `versions` array
    // ########################################

    const { versions } = dp;
    this._lastVersions = new Array(versions.length);
    this._copyVersions(versions);
  }

  _copyVersions(newVersions) {
    for (let i = 0; i < this.cfg.collectionIds.length; ++i) {
      const id = this.cfg.collectionIds[i];
      this._lastVersions[id] = newVersions[id];
    }
  }

  _updateVersions(newVersions) {
    for (let i = 0; i < this.cfg.collectionIds.length; ++i) {
      const id = this.cfg.collectionIds[i];
      if (this._lastVersions[id] !== newVersions[id]) {
        // new version
        this._copyVersions(newVersions);
        return true;
      }
    }
    return false;
  }

  /**
   * Called upon a cache miss: run query for args and cache result.
   */
  _getOrUpdateCachedEntry(args) {
    const { dp } = this;
    let result = this.executeQuery(dp, args);
    if (result === DoesNotExist) {
      // value does not exist
      if (this.cfg.onlyCacheExisting) {
        // don't cache
        return result;
      }

      // set to `null`; because `DoesNotExist === undefined`
      result = null;
    }

    // put result back into cache
    this.storeByKey(args, result);
    return result;
  }
}