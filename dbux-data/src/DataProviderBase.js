import path from 'path';
import pull from 'lodash/pull';
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
   * Internal event listeners.
   * 
   * @private
   */
  _dataEventListenersInternal = {};

  /**
   * Outside event listeners.
   * 
   * @private
   */
  _dataEventListeners = {};

  /**
   * @type {number[]}
   */
  versions = [];

  /**
   * @type {StaticProgramContext}
   */
  application;

  /**
   * @type {DataProviderUtil}
   */
  util;

  constructor(name) {
    this.name = name;
    this.logger = newLogger(name);
    this.collections = {};

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

  // ###########################################################################
  // Public methods
  // ###########################################################################

  /**
   * Add a data event listener to given collection.
   * 
   * @param {string} collectionName
   * @param {([]) => void} cb
   * @returns {function} Unsubscribe function - Execute to cancel this listener.
   */
  onData(collectionName, cb) {
    const listeners = this._dataEventListeners[collectionName] =
      (this._dataEventListeners[collectionName] || []);
    listeners.push(cb);

    const unsubscribe = (() => {
      pull(this._dataEventListeners[collectionName], cb);
    });
    return unsubscribe;
  }

  /**
   * Bundled data listener.
   * 
   * @returns {function} Unsubscribe function - Execute to cancel this listener.
   */
  onDataAll(cfg) {
    for (const collectionName in cfg.collections) {
      const cb = cfg.collections[collectionName];
      const listeners = this._dataEventListeners[collectionName] = (this._dataEventListeners[collectionName] || []);
      listeners.push(cb);
    }

    const unsubscribe = (() => {
      for (const collectionName in cfg.collections) {
        const cb = cfg.collections[collectionName];
        pull(this._dataEventListeners[collectionName], cb);
      }
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
  addData(allData) {
    // sanity checks
    if (!allData || allData.constructor.name !== 'Object') {
      logError('invalid data must be (but is not) object -', JSON.stringify(allData).substring(0, 500));
    }

    // debug('received', JSON.stringify(allData).substring(0, 500));

    this._addData(allData);
    this._postAdd(allData);
  }

  addQuery(newQuery) {
    this.queries._addQuery(this, newQuery);
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
        logError('received data referencing invalid collection -', collectionName);
        delete this.collections[collectionName];
        continue;
      }

      const entries = allData[collectionName];
      ++this.versions[collection._id]; // update version
      collection.add(entries);
    }
  }

  _postAdd(allData) {
    // notify collections that adding has finished
    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      const entries = allData[collectionName];
      collection.postAdd(entries);
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

    // notify collections that adding + index processing has finished
    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      const entries = allData[collectionName];
      collection.postIndex(entries);
    }

    // fire internal event listeners
    for (const collectionName in allData) {
      // const collection = this.collections[collectionName];
      const data = allData[collectionName];
      this._notifyData(collectionName, data, this._dataEventListenersInternal);
    }


    // fire public event listeners
    for (const collectionName in allData) {
      // const collection = this.collections[collectionName];
      const data = allData[collectionName];
      this._notifyData(collectionName, data, this._dataEventListeners);
    }
  }

  /**
   * 
   * @param {string} collectionName 
   * @param {[]} data 
   * @param {*} allListeners 
   */
  _notifyData(collectionName, data, allListeners) {
    const listeners = allListeners[collectionName];
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(data);
        }
        catch (err) {
          logError('Data event listener failed', err);
        }
      });
    }
  }

  /**
   * Serialize all raw data into a simple JS object.
   * Usage: `JSON.stringify(dataProvider.serialize())`.
   */
  serialize() {
    const collections = Object.values(this.collections);
    const obj = {
      version: this.version,
      collections: Object.fromEntries(collections.map(collection => {
        let {
          name,
          _all: entries
        } = collection;

        entries = entries.map(e => {
          const newEntry = { ...e };

          // delete some temps
          delete newEntry.valueString;
          delete newEntry.valueStringShort;
          return newEntry;
        });

        return [
          name,
          entries
        ];
      }))
    };
    return JSON.stringify(obj, null, 2);
  }

  /**
   * Use: `dataProvider.deserialize(JSON.parse(stringFromFile))`
   */
  deserialize(data) {
    const { version, collections } = data;
    if (version !== this.version) {
      throw new Error(`could not serialize DataProvider - incompatible version: ${version} !== ${this.version}`);
    }
    this.addData(collections);
  }
}
