import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import Collection from './Collection';
import TracesByFileIndex from './impl/indexes/TracesByFileIndex';
import Queries from './queries/Queries';
import Indexes from './indexes/Indexes';

const { log, debug, warn, error: logError } = newLogger('DataProvider');


class StaticProgramContextCollection extends Collection {
  constructor(dp) {
    super('staticProgramContexts', dp);
  }
}

class StaticContextCollection extends Collection {
  constructor(dp) {
    super('staticContexts', dp);
  }
}

class StaticTraceCollection extends Collection {
  constructor(dp) {
    super('staticTraceContexts', dp);
  }
}

class ExecutionContextCollection extends Collection<ExecutionContext> {
  constructor(dp) {
    super('executionContexts', dp);
  }
}

/**
 * The runtime `traceCollection` currently uses JSON for serializing (and copying) the value.
 * Here we need to parse it back.
 */
function deserializeValue(value) {
  return JSON.parse(value);
}

class TraceCollection extends Collection<Trace> {
  constructor(dp) {
    super('traces', dp);
  }

  add(entries) {
    for (const entry of entries) {
      if (entry.value) {
        entry.value = deserializeValue(entry.value);
      }
    }
    super.add(entries);
  }
}


export default class DataProvider {
  // /**
  //  * Usage example: `dataProvider.collections.staticContexts.getById(id)`
  //  * 
  //  * @public
  //  */
  // collections;

  /**
   * @private
   */
  _dataEventListeners : (any) => void = {};
  versions : number[] = [];

  constructor() {
    this.clear();

    this.queries = new Queries();
    this.indexes = new Indexes();
  }

  /**
   * Add a data event listener to given collection.
   */
  onData(collectionName : string, cb : ([]) => void ) {
    const listeners = this._dataEventListeners[collectionName] = (this._dataEventListeners[collectionName] || []);
    listeners.push(cb);
  }

  /**
   * Deletes all previously stored data.
   */
  clear() {
    this.collections = {
      staticProgramContexts: new StaticProgramContextCollection(this),
      staticContexts: new StaticContextCollection(this),
      staticTraces: new StaticTraceCollection(this),

      executionContexts: new ExecutionContextCollection(this),
      traces: new TraceCollection(this)
    };
  }

  /**
   * Add given data (of different collections) to this `DataProvier`
   */
  addData(allData): { [string]: any[] } {
    debug('received', allData);

    if (!allData || allData.constructor.name !== 'Object') {
      logError('invalid data must be (but is not) object -', allData);
    }

    this._addData(allData);
    this._postAdd(allData);
  }

  _addData(allData) {
    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      if (!collection) {
        // should never happen
        logError('received data referencing invalid collection -', collectionName);
        delete this.collections[collectionName];
        continue;
      }

      const data = allData[collectionName];
      ++this.versions[collection._id];    // update version
      collection.add(data);
    }
  } 

  _postAdd(allData) {
    // process new data (most importantly: indexes)
    for (const collectionName in allData) {
      const indexes = this.indexes[collectionName];
      if (indexes) {
        const data = allData[collectionName];
        for (const name in indexes) {
          indexes[name].addEntries(this, data);
        }
      }
    }

    // fire event listeners
    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      const data = allData[collectionName];
      this._notifyData(collectionName, data);
    }
  }

  _notifyData(collectionName : string, data : []) {
    const listeners = this._dataEventListeners[collectionName];
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }
  }



  addQuery(newQuery) {
    this.queries._addQuery(this, newQuery);
  }

  addIndex(newIndex) {
    this.indexes._addIndex(newIndex);
  }
}
