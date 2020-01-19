import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import DataEntry from 'dbux-common/src/core/data/DataEntry';
import Collection from './Collection';
import TracesByFileIndex from './impl/indexes/TracesByFileIndex';
import Queries from './queries/Queries';
import Indexes from './indexes/Indexes';

const { log, debug, warn, error: logError } = newLogger('DataProvider');

export type DataCallback = (DataEntry[]) => void;

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
  _dataEventListeners : DataCallback = {};
  versions : number[] = [];

  constructor() {
    this.clear();

    this.queries = new Queries();
    this.indexes = new Indexes();
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
  addData(allData): { [string]: DataEntry[] } {
    debug('received', allData);

    if (!allData || allData.constructor.name !== 'Object') {
      logError('invalid data must be (but is not) object -', allData);
    }

    this._addData(allData);
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
      const index = this.indexes[collectionName];
      const data = allData[collectionName];
      index._processNewEntries(data);
    }

    // fire event listeners
    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      const data = allData[collectionName];
      this._notifyData(collectionName, data);
    }
  }

  /**
   * Add a data event listener to given collection.
   */
  onData(collectionName : string, cb : DataCallback ) {
    const listeners = this._dataEventListeners[collectionName] = (this._dataEventListeners[collectionName] || []);
    listeners.push(cb);
  }

  _notifyData(collectionName : string, data : DataEntry[]) {
    const listeners = this._dataEventListeners[collectionName];
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }
  }
}
