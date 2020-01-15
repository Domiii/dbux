import { logInternalError, newLogger, logDebug } from 'dbux-common/src/log/logger';
import Collection from './Collection';

const { log, debug, warn, error: logError } = newLogger('DATA');

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

class ExecutionContextCollection extends Collection {
  constructor(dp) {
    super('executionContexts', dp);
  }
}

class TraceCollection extends Collection {
  constructor(dp) {
    super('traces', dp);
  }
}


export default class DataProvider {
  collections;
  _dataEventListeners = {};

  constructor() {
    this.clear();
  }

  clear() {
    this.collections = {
      staticProgramContexts: new StaticProgramContextCollection(this),
      staticContexts: new StaticContextCollection(this),
      staticTraces: new StaticTraceCollection(this),

      executionContexts: new ExecutionContextCollection(this),
      traces: new TraceCollection(this)
    };
  }

  addData(allData) {
    debug('received', allData);

    if (!allData || allData.constructor.name !== 'Object') {
      logInternalError('invalid data must be (but is not) object -', allData);
    }

    for (const collectionName in allData) {
      const collection = this.collections[collectionName];
      if (!collection) {
        logInternalError('received data referencing invalid collection -', collectionName);
        continue;
      }

      const data = allData[collectionName];
      collection.add(data);
      this._notifyData(collectionName, data);
    }
  }

  onData(collectionName, cb) {
    const listeners = this._dataEventListeners[collectionName] = (this._dataEventListeners[collectionName] || []);
    listeners.push(cb);
  }

  _notifyData(collectionName, data) {
    const listeners = this._dataEventListeners[collectionName];
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }
  }
}