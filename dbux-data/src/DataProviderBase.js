import pull from 'lodash/pull';
import isPlainObject from 'lodash/isPlainObject';
// import isString from 'lodash/isString';
import { newLogger } from '@dbux/common/src/log/logger';
import Queries from './queries/Queries';
import Indexes from './indexes/Indexes';

export default class DataProviderBase {
  /**
   * Used for serialization
   */
  version = 1;

  // /**
  //  * Usage example: `dataProvider.collections.staticContexts.getById(id)`
  //  * 
  //  * @public
  //  */
  // collections;

  /**
   * Internal per-collection event listeners.
   * TODO: replace with nanoevents
   * 
   * @private
   */
  _dataEventListenersInternal = {};

  /**
   * Outside per-collection event listeners.
   * TODO: replace with nanoevents
   * 
   * @private
   */
  _dataEventListeners = {};

  /**
   * Outside general event listeners.
   * TODO: replace with nanoevents
   *
   * @private
   */
  _dataListenersAny = [];

  /**
   * @type {number[]}
   */
  versions = [];

  queryImpl = {};

  constructor(name) {
    this.name = name;
    this.logger = newLogger(name);
    this.collections = {};
    this.filters = {};

    // const collectionClasses = [
    //   StaticProgramContextCollection,
    //   StaticContextCollection,
    //   StaticTraceCollection,

    //   ExecutionContextCollection,
    //   TraceCollection,
    //   ValueCollection
    // ];
    // this.collections = Object.fromEntries(collectionClasses.map(Col => {
    //   const col = new Col(this);
    //   return [col.name, col];
    // }));

    this.queries = new Queries();
    this.indexes = new Indexes();
  }

  _normalizeQueryCfg(cfg) {
    // TODO
  }

  // ###########################################################################
  // Public methods
  // ###########################################################################

  validateCollectionName(collectionName) {
    const collection = this.collections[collectionName];
    if (!collection) {
      throw new Error(`invalid collection name "${collectionName}"`);
    }
  }

  getData(cfg) {
    const {
      collectionName,
      filter: filterName
    } = cfg;
    return this.collections.executionContexts.getAll();
  }


  /**
   * Add a data event listener to given collection.
   * 
   * @param {string|object} cfgOrCollectionName
   * @param {([]) => void} cb
   * @returns {function} Unsubscribe function - Execute to cancel this listener.
   */
  onData(cfgOrCollectionName, cb) {
    let collectionName;
    const cfg = cfgOrCollectionName;
    if (isPlainObject(cfg)) {
      if (cfg.query) {
        // TODO: fix this.
        //   Purpose: allow listening not just on collections, but also on incremental queries etc.
        throw new Error('NYI');
        // let queryName = cfg.query;
        // const query = this.queries[queryName];
        // if (!query) {
        //   throw new Error(`invalid filter "${queryName}" in ${this.constructor.name}.onData: ${JSON.stringify(cfg)}`);
        // }

        // const origCb = cb;
        // cb = data => {
        //   data = query.execute(this, data);
        //   if (!data?.length) {
        //     origCb(data);
        //   }
        // };

        // TODO: not all queries know their dependencies yet. fix that
        // for (const collectionName of query?.cfg?.collectionNames) {

        // }
      }
      if (cfg.collections) {
        // TODO: make sure, it works in conjection with `query` configuration
        return this._onMultiCollectionData(cfg.collections, this._dataEventListeners);
      }

      // we currently only consider querys + collections
      throw new Error('NYI');
    }
    // if (isString(cfgOrCollectionName)) {
    else {
      collectionName = cfgOrCollectionName;
      return this._onCollectionData(collectionName, cb);
    }
  }

  _onCollectionData(collectionName, cb) {
    this.validateCollectionName(collectionName);
    const listeners = this._dataEventListeners[collectionName] =
      (this._dataEventListeners[collectionName] || []);
    listeners.push(cb);

    const unsubscribe = (() => {
      pull(this._dataEventListeners[collectionName], cb);
    });
    return unsubscribe;
  }

  /**
   * @returns {function} Unsubscribe function - Execute to cancel this listener.
   */
  _onMultiCollectionData(collectionCallbacks, allListeners = this._dataEventListeners) {
    for (const collectionName in collectionCallbacks) {
      const cb = collectionCallbacks[collectionName];
      const listeners = allListeners[collectionName] = (allListeners[collectionName] || []);
      listeners.push(cb);
    }

    const unsubscribe = (() => {
      for (const collectionName in collectionCallbacks) {
        const cb = collectionCallbacks[collectionName];
        pull(allListeners[collectionName], cb);
      }
    });
    return unsubscribe;
  }

  onAnyData(cb) {
    this._dataListenersAny.push(cb);

    const unsubscribe = (() => {
      pull(this._dataListenersAny, cb);
    });
    return unsubscribe;
  }

  /**
   * Deletes all previously stored data.
   */
  clear() {
    throw new Error('NYI - we are not properly reseting (i) indexes and (ii) queries yet');
  }

  /**
   * Add given data (of different collections) to this `DataProvier`
   * @param {{ [string]: any[] }} allData
   */
  addData(allData, isRaw = true) {
    // sanity checks
    if (!allData || allData.constructor.name !== 'Object') {
      this.logger.error('invalid data must be (but is not) object -', JSON.stringify(allData).substring(0, 500));
    }

    // debug('received', JSON.stringify(allData).substring(0, 500));

    this._addData(allData);
    this._postAdd(allData, isRaw);
  }

  addQuery(newQuery) {
    this.queries._addQuery(this, newQuery);
    newQuery._init(this);
  }

  addIndex(newIndex) {
    this.indexes._addIndex(newIndex);
    newIndex._init(this);

    // add event listeners on collections that this index depends on
    const collectionListeners = newIndex.dependencies?.collections;
    if (collectionListeners) {
      for (const collectionName in collectionListeners) {
        const cb = collectionListeners[collectionName].added;
        this._onDataInternal(collectionName, cb);
      }
    }
  }

  _onDataInternal(collectionName, cb) {
    const listeners = this._dataEventListenersInternal[collectionName] = (
      this._dataEventListenersInternal[collectionName] || []
    );
    if (cb) {
      listeners.push(cb);
    }
  }


  // ###########################################################################
  // Private methods
  // ###########################################################################

  _addData(allData) {
    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      if (!collection) {
        // should never happen
        this.logger.error('received data with invalid collection name -', collectionName);
        delete this.collections[collectionName];
        continue;
      }

      const entries = allData[collectionName];
      ++this.versions[collection._id]; // update version
      collection.add(entries);
    }
  }

  _postAdd(allData, isRaw) {
    if (isRaw) {
      // notify collections that adding(raw data) has finished
      for (const collectionName in allData) {
        const collection = this.collections[collectionName];
        const entries = allData[collectionName];
        collection.postAddRaw(entries);
      }
    }

    // notify collections that adding(processed data) has finished
    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      const entries = allData[collectionName];
      collection.postAddProcessed(entries);
    }

    // indexes
    for (const collectionName in allData) {
      const indexes = this.indexes[collectionName];
      if (indexes) {
        const data = allData[collectionName];
        for (const name in indexes) {
          const index = indexes[name];
          if (index.addOnNewData) {
            indexes[name].addEntries(data);
          }
        }
      }
    }

    // NOTE: Temporarily disabled, needs to ensure this wont mutate data
    // // notify collections that adding + index processing has finished
    // for (const collectionName in allData) {
    //   const collection = this.collections[collectionName];
    //   const entries = allData[collectionName];
    //   collection.postIndex(entries);
    // }

    // notify internal and external listeners
    this._notifyData(allData);
  }

  _notifyData(allData) {
    // fire internal event listeners
    for (const collectionName in allData) {
      // const collection = this.collections[collectionName];
      const data = allData[collectionName];
      this._notifyDataSet(collectionName, data, this._dataEventListenersInternal);
    }


    // fire public event listeners
    for (const collectionName in allData) {
      // const collection = this.collections[collectionName];
      const data = allData[collectionName];
      this._notifyDataSet(collectionName, data, this._dataEventListeners);
    }

    this._notifyListeners(allData, this._dataListenersAny);
  }

  /**
   * 
   * @param {string} collectionName 
   * @param {[]} data 
   * @param {*} listenerMap 
   */
  _notifyDataSet(collectionName, data, listenerMap) {
    const listeners = listenerMap[collectionName];
    if (listeners) {
      this._notifyListeners(data, listeners);
    }
  }

  _notifyListeners(data, listeners) {
    listeners.forEach((cb) => {
      try {
        cb(data);
      }
      catch (err) {
        this.logger.error('Data event listener failed', err);
      }
    });
  }

  /**
   * Serialize collection data into a simple JS object. Including all collection data by default.
   * Usage: `JSON.stringify(dataProvider.serializeJson())`.
   * Usage: `JSON.stringify(dataProvider.serializeJson(Object.entries(allData)))`.
   */
  serializeJson(collections = Object.entries(this.collections).map(([name, collection]) => [name, collection._all])) {
    const obj = {
      version: this.version,
      collections: Object.fromEntries(collections.map(([name, entries]) => {
        const collection = this.collections[name];
        
        if (!entries[0]) {
          entries = entries.slice(1);
        }

        // convert complex entry into simple JS Object
        if (collection.serialize) {
          entries = entries.map(entry => collection.serialize(entry));
        }

        return [
          name,
          entries
        ];
      }))
    };
    return obj;
  }

  /**
   * Use: `dataProvider.deserializeJson(JSON.parse(serializedString))`
   */
  deserializeJson(data) {
    const { version, collections } = data;
    if (version !== this.version) {
      throw new Error(`could not serialize DataProvider - incompatible version: ${version} !== ${this.version}`);
    }

    for (const collectionName in collections) {
      const collection = this.collections[collectionName];
      if (collection.deserialize) {
        collections[collectionName] = collections[collectionName].map(obj => collection.deserialize(obj));
      }
    }
    this.addData(collections, false);
  }
}
