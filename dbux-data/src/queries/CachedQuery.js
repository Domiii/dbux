import Query from './Query';

const DoesNotExist = undefined;

function makeKey(args) {
  // TODO: improve efficiency of this!
  return JSON.stringify(args);
}

// ###########################################################################
// CachedQuery
// ###########################################################################

/**
 * This type of query caches it's results.
 * Still requires implementing the `Query.execute` function.
 */
export default class CachedQuery extends Query {
  _cache = new Map();
  _lastVersions;

  _init(dp) {
    // ########################################
    // fix config
    // ########################################
    const {
      collectionNames,
      onlyCacheExisting = false
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
      collectionIds = Object.values(dp.collections).map(c => c._id);
    }

    // NOTE: sorted versions makes it more cache-efficient when looping over the version arrays
    collectionIds.sort((a, b) => a - b);

    this.cfg = Object.assign(this.cfg, {
      collectionNames,
      collectionIds,
      onlyCacheExisting
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

  /**
   * Clear cache if collection versions don't match.
   * NOTE: collection versions are updated any time data is added.
   */
  _checkVersions(newVersions) {
    for (let i = 0; i < this.cfg.collectionIds.length; ++i) {
      const id = this.cfg.collectionIds[i];
      if (this._lastVersions[id] !== newVersions[id]) {
        // new version -> clear cache
        this._copyVersions(newVersions);
        this._cache.clear();
        break;
      }
    }
  }

  lookup(args) {
    const key = makeKey(args);
    return this._cache[key];
  }

  performQuery(dp, args) {
    // check versions
    this._checkVersions(dp.versions);

    // lookup
    const key = makeKey(args);
    let result = this._cache.get(key);

    if (result === DoesNotExist) {
      // cache miss -> actually perform the query
      result = this.execute(dp, args);
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
      this._cache.set(key, result);
    }
    return result;
  }

  executor(dp, args) {
    return this._cache.performQuery(dp, args, this);
  }
}