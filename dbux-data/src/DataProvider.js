import path from 'path';
import pull from 'lodash/pull';
import { newLogger } from 'dbux-common/src/log/logger';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import Trace from 'dbux-common/src/core/data/Trace';
import ValueRef from 'dbux-common/src/core/data/ValueRef';
import StaticProgramContext from 'dbux-common/src/core/data/StaticProgramContext';
import StaticContext from 'dbux-common/src/core/data/StaticContext';
import StaticTrace from 'dbux-common/src/core/data/StaticTrace';
import deserialize from 'dbux-common/src/serialization/deserialize';

import Collection from './Collection';
import Queries from './queries/Queries';
import Indexes from './indexes/Indexes';
import TraceType, { isTraceExpression } from '../../dbux-common/src/core/constants/TraceType';

const { log, debug, warn, error: logError } = newLogger('DataProvider');

class StaticProgramContextCollection extends Collection<StaticProgramContext> {
  constructor(dp) {
    super('staticProgramContexts', dp);
  }

  add(entries) {
    for (const entry of entries) {
      if (!entry.filePath || !path.isAbsolute(entry.filePath)) {
        logError('invalid `staticProgramContext.filePath` is not absolute - don\'t know how to resolve', entry.fileName);
      }

      // set applicationId, so we can trace any data point back to it's application
      entry.applicationId = this.dp.application.applicationId;
    }
    super.add(entries);
  }
}

class StaticContextCollection extends Collection<StaticContext> {
  constructor(dp) {
    super('staticContexts', dp);
  }
}

class StaticTraceCollection extends Collection<StaticTrace> {
  constructor(dp) {
    super('staticTraceContexts', dp);
  }
}

class ExecutionContextCollection extends Collection<ExecutionContext> {
  constructor(dp) {
    super('executionContexts', dp);
  }

  add(entries) {
    for (const entry of entries) {
      if (!entry.parentContextId) {
        // set applicationId, so we can trace any data point back to it's application
        entry.applicationId = this.dp.application.applicationId;
      }
    }
    super.add(entries);
  }
}


class TraceCollection extends Collection<Trace> {
  constructor(dp) {
    super('traces', dp);
  }

  add(traces) {
    // set applicationId
    for (const trace of traces) {
      trace.applicationId = this.dp.application.applicationId;
    }

    super.add(traces);
  }

  postAdd(traces: Trace[]) {
    try {
      // build dynamic call expression tree
      this.resolveCallIds(traces);
    }
    catch (err) {
      logError('resolveCallIds failed', traces, err);
    }
  }

  resolveCallIds(traces: Trace[]) {
    const beforeCalls = [];
    for (const trace of traces) {
      const { traceId, staticTraceId } = trace;
      const staticTrace = this.dp.collections.staticTraces.getById(staticTraceId);
      const traceType = this.dp.util.getTraceType(traceId);
      if (traceType === TraceType.BeforeCallExpression) {
        beforeCalls.push(trace);
        // console.log(' '.repeat(beforeCalls.length - 1), '>', trace.traceId, staticTrace.displayName);
      }
      else if (isTraceExpression(traceType)) {
        // NOTE: `isTraceExpression` to filter out Push/PopCallback
        if (staticTrace.resultCallId) {
          // call results: reference their call by `resultCallId` and vice versa by `resultId`
          // NOTE: upon seeing a result, we need to pop *before* handling its potential role as argument
          const beforeCall = beforeCalls.pop();
          // console.log(' '.repeat(beforeCalls.length), '<', beforeCall.traceId, `(${staticTrace.displayName} [${TraceType.nameFrom(this.dp.util.getTraceType(traceId))}])`);
          if (staticTrace.resultCallId !== beforeCall.staticTraceId) {
            logError('for resultCallId', 'staticTrace.resultCallId !== beforeCall.staticTraceId -', staticTrace.displayName, trace, beforeCall);
            beforeCalls.push(beforeCall);   // something is wrong -> push it back
          }
          else {
            beforeCall.resultId = traceId;
            trace.resultCallId = beforeCall.traceId;
          }
        }
        if (staticTrace.callId) {
          // call args: reference their call by `callId`
          const beforeCall = beforeCalls[beforeCalls.length - 1];
          if (staticTrace.callId !== beforeCall.staticTraceId) {
            logError('for callId', 'staticTrace.callId !== beforeCall.staticTraceId', staticTrace, beforeCall);
          }
          trace.callId = beforeCall.traceId;
        }
      }
    }
  }
}

class ValueCollection extends Collection<ValueRef> {
  constructor(dp) {
    super('values', dp);
  }

  add(entries) {
    for (const entry of entries) {
      entry.value = deserialize(entry.serialized);
      entry.serialized = null; // don't need this, so don't keep it around
    }
    super.add(entries);
  }
}


export default class DataProvider {
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

  versions: number[] = [];
  application: StaticProgramContext;
  util: any;

  constructor(application) {
    this.application = application;

    this.collections = {
      staticProgramContexts: new StaticProgramContextCollection(this),
      staticContexts: new StaticContextCollection(this),
      staticTraces: new StaticTraceCollection(this),

      executionContexts: new ExecutionContextCollection(this),
      traces: new TraceCollection(this),
      values: new ValueCollection(this)
    };

    this.queries = new Queries();
    this.indexes = new Indexes();
  }

  // ###########################################################################
  // Public methods
  // ###########################################################################

  /**
   * Add a data event listener to given collection.
   * 
   * @returns {function} Unsubscribe function - Execute to cancel this listener.
   */
  onData(collectionName: string, cb: ([]) => void) {
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

    const unsubscribe = ((cfg) => {
      for (const collectionName in cfg.collections) {
        const cb = cfg.collections[collectionName];
        pull(this._dataEventListeners[collectionName], cb);
      }
    }).bind(this, cfg);
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
   */
  addData(allData): { [string]: any[] } {
    // sanity checks
    if (!allData || allData.constructor.name !== 'Object') {
      logError('invalid data must be (but is not) object -', allData);
    }

    // debug('received', allData);

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
          indexes[name].addEntries(data);
        }
      }
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

  _notifyData(collectionName: string, data: [], allListeners) {
    const listeners = allListeners[collectionName];
    if (listeners) {
      listeners.forEach((cb) => cb(data));
    }
  }

  /**
   * Serialize all raw data into a simple JS object.
   * Usage: `JSON.stringify(dataProvider.serialize())`.
   */
  serialize() {
    const collections = Object.values(this.collections);
    return {
      version: this.version,
      collections: Object.fromEntries(collections.map(collection => {
        const {
          name,
          _all: entries
        } = collection;

        return [
          name,
          entries
        ];
      }))
    };
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
