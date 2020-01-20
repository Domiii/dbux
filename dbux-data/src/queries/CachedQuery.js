import Query from './Query';
import isEqual from 'lodash/isEqual';

// ###########################################################################
// QueryCache
// ###########################################################################

function makeKey(args) {
  // TODO: improve efficiency of this!
  return JSON.stringify(args);
}

class QueryCache {
  _cache = new Map();
  _lastVersions;

  constructor(versionDependencies, versions) {
    this._versionDependencies = versionDependencies;
    
    // copy `versions` array
    this._lastVersions = new Array(versions.length); 
    this._copyVersions(versions);
  }

  _copyVersions(newVersions) {
    for (let i = 0; i < this._versionDependencies.length; ++i) {
      const id = this._versionDependencies[i];
      this._lastVersions[id] = newVersions[id];
    }
  }

  _checkVersions(newVersions) {
    for (let i = 0; i < this._versionDependencies.length; ++i) {
      const id = this._versionDependencies[i];
      if (this._lastVersions[id] !== newVersions[id]) {
        // new version -> clear cache; (probably) need to do everything again
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

  performQuery(dp, args, query) {
    // check versions
    this._checkVersions(dp.versions);

    // lookup
    const key = makeKey(args);
    let result = this._cache.get(key);

    if (result === undefined) {
      // does not exist yet -> actually perform the query
      result = query.execute(dp, args);
      if (result === undefined) {
        // set to `null`, so `undefined` can represent "non-existing values"
        result = null;
      }

      // put result back into cache
      this._cache.set(key, result);
    }
    return result;
  }
}


// ###########################################################################
// CachedQuery
// ###########################################################################

export default class CachedQuery extends Query {
  _init(dp) {
    const versionDependencyNames = this.cfg?.versionDependencies;
    let versionDependencies;
    if (versionDependencyNames) {
      // depends only on limited set of collections
      versionDependencies = versionDependencyNames.map(name => {
        const collection = dp.collections[name];
        if (!collection) {
          throw new Error(`invalid collection name in ${this.constructor.name}.cfg.versionDependencies`);
        }
        return collection._id;
      });
    }
    else {
      // depends on all collections
      versionDependencies = Object.values(dp.collections).map(c => c._id);
    }

    // JS: this is how we sort numbers in ascending order
    // NOTE: sorting makes it more cache-efficient when looping over the version arrays
    versionDependencies.sort((b, a) => b - a);
    
    this._cache = new QueryCache(versionDependencies, dp.versions);
  }

  executor = (dp, args) => this._cache.performQuery(dp, args, this);

  execute() {
    throw new Error(`abstract method not implemented: ${this.constructor.name}.execute`);
  }
}