import path from 'path';
import pull from 'lodash/pull';
import { newLogger } from 'dbux-common/src/log/logger';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import Trace from 'dbux-common/src/core/data/Trace';
import ValueRef from 'dbux-common/src/core/data/ValueRef';
import StaticProgramContext from 'dbux-common/src/core/data/StaticProgramContext';
import StaticContext from 'dbux-common/src/core/data/StaticContext';
import StaticTrace from 'dbux-common/src/core/data/StaticTrace';
import ValueTypeCategory, { ValuePruneState } from 'dbux-common/src/core/constants/ValueTypeCategory';
import TraceType, { isTraceExpression, isTracePop, isTraceFunctionExit, isBeforeCallExpression, isTraceThrow } from 'dbux-common/src/core/constants/TraceType';
import { hasCallId, isCallResult, isCallExpressionTrace } from 'dbux-common/src/core/constants/traceCategorization';

import Collection from './Collection';
import Queries from './queries/Queries';
import Indexes from './indexes/Indexes';

import DataProviderUtil from './dataProviderUtil';

const { log, debug, warn, error: logError } = newLogger('DataProvider');

function errorWrapMethod(obj, methodName, ...args) {
  try {
    // build dynamic call expression tree
    /* eslint prefer-spread: 0 */ // (false positive)
    obj[methodName].apply(obj, args);
  }
  catch (err) {
    logError(`${obj.constructor.name}.${methodName}`, 'failed\n  ', err); //...args);
  }
}

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
    super('staticTraces', dp);
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

  /**
   * @param {ExecutionContext[]} contexts 
   */
  postIndex(contexts) {
    try {
      // determine last trace of every context
      this.resolveLastTraceOfContext(contexts);
    }
    catch (err) {
      logError('resolveLastTraceOfContext failed', err); //contexts);
    }
  }

  resolveLastTraceOfContext() {
    // TODO
    // return !isReturnTrace(traceType) && !isTracePop(traceType) &&   // return and pop traces indicate that there was no error in that context
    //   dp.util.isLastTraceInContext(traceId) &&        // is last trace we have recorded
    //   !dp.util.isLastTraceInStaticContext(traceId);   // but is not last trace in the code
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

  /**
   * Post processing of trace data
   */
  postAdd(traces: Trace[]) {
    // build dynamic call expression tree
    errorWrapMethod(this, 'resolveCallIds', traces);
    errorWrapMethod(this, 'resolveErrorTraces', traces);
  }

  /**
   * TODO: This will not work with asynchronous call expressions (which have `await` arguments).
   */
  resolveCallIds(traces: Trace[]) {
    const beforeCalls = [];
    for (const trace of traces) {
      const { traceId, staticTraceId } = trace;
      const staticTrace = this.dp.collections.staticTraces.getById(staticTraceId);
      const traceType = this.dp.util.getTraceType(traceId);
      if (isBeforeCallExpression(traceType)) {
        trace.callId = trace.traceId;  // refers to its own call
        beforeCalls.push(trace);
        // debug('[callIds]', ' '.repeat(beforeCalls.length - 1), '>', trace.traceId, staticTrace.displayName);
      }
      else if (isCallExpressionTrace(staticTrace)) {
        // NOTE: `isTraceExpression` to filter out Push/PopCallback
        if (isCallResult(staticTrace)) {
          // call results: reference their call by `resultCallId` and vice versa by `resultId`
          // NOTE: upon seeing a result, we need to pop *before* handling its potential role as argument
          let beforeCall = beforeCalls.pop();
          // debug('[callIds]', ' '.repeat(beforeCalls.length), '<', beforeCall.traceId, `(${staticTrace.displayName} [${TraceType.nameFrom(this.dp.util.getTraceType(traceId))}])`);
          if (staticTrace.resultCallId !== beforeCall.staticTraceId) {
            // maybe something did not get popped. Let's look for it directly!
            const idx = beforeCalls.findIndex(bce => bce.staticTraceId === staticTrace.resultCallId);
            if (idx >= 0) {
              // it's on the stack - just take it
              beforeCall = beforeCalls[idx];
              beforeCalls.splice(idx, 1);
            }
            else {
              // it's just not there...
              beforeCalls.push(beforeCall);   // something is wrong -> push it back
              const stackInfo = beforeCalls.map(t => `#${t.staticTraceId} ${this.dp.collections.staticTraces.getById(t.staticTraceId)?.displayName || '(no staticTrace found)'}`);
              logError(`Could not resolve resultCallId for trace "#${staticTrace.staticTraceId} ${staticTrace.displayName}" (traceId ${traceId}). resultCallId ${staticTrace.resultCallId} not matching beforeCall.staticTraceId #${beforeCall.staticTraceId}. BCE Stack:\n  ${stackInfo.join('\n  ')}`);

              beforeCall = null;
            }
          }
          
          if (beforeCall) {
            // all good!
            beforeCall.resultId = traceId;
            trace.resultCallId = beforeCall.traceId;
          }
        }
        if (hasCallId(staticTrace)) {
          // call args: reference their call by `callId`
          const beforeCall = beforeCalls[beforeCalls.length - 1];
          if (staticTrace.callId !== beforeCall?.staticTraceId) {
            logError('[callId]', beforeCall?.staticTraceId, staticTrace.staticTraceId, 'staticTrace.callId !== beforeCall.staticTraceId - is trace participating in a CallExpression-tree? [', staticTrace.displayName, '][', trace, '][', beforeCall, `]. Stack staticTraceIds: ${beforeCalls.map(t => t.staticTraceId)}`);
          }
          else {
            trace.callId = beforeCall.traceId;
          }
        }
      }
    }
  }

  resolveErrorTraces(traces) {
    for (const trace of traces) {
      const {
        traceId,
        previousTrace: previousTraceId
      } = trace;

      const traceType = this.dp.util.getTraceType(traceId);
      if (!isTracePop(traceType) || !previousTraceId) {
        // only (certain) pop traces can generate errors
        continue;
      }

      const staticContext = this.dp.util.getTraceStaticContext(traceId);
      if (staticContext.isInterruptable) {
        // interruptable contexts only have `Push` and `Pop` traces, everything else (including error handling!) is in `Resume` children
        continue;
      }

      const previousTraceType = this.dp.util.getTraceType(previousTraceId);
      if (!isTraceFunctionExit(previousTraceType)) {
        // before pop must be a function exit trace, else -> error!
        trace.error = true;

        // guess error trace
        const previousTrace = this.dp.collections.traces.getById(previousTraceId);
        const { staticTraceId, callId, resultCallId } = previousTrace;
        if (isTraceThrow(previousTraceType)) {
          // trace is error trace
          trace.staticTraceId = staticTraceId;
        }
        else if (callId) {
          // participates in a call but call did not finish -> set expected error trace to BCE
          const callTrace = this.dp.collections.traces.getById(callId);
          if (callTrace.resultId) {
            // strange...
            logError('last (non-result) call trace in error context has `resultId`', callTrace.resultId, callTrace);
          }
          else {
            // the call trace caused the error
            trace.staticTraceId = callTrace.staticTraceId;
          }
        }
        else if (resultCallId) {
          // the last trace we saw was a successful function call. error was caused by next trace of that function call
          const resultTrace = this.dp.collections.traces.getById(resultCallId);
          trace.staticTraceId = resultTrace.staticTraceId + 1;
        }
        else {
          // the error trace is (probably) the trace following the last executed trace
          trace.staticTraceId = staticTraceId + 1;
        }
      }
    }
  }
}

class ValueCollection extends Collection<ValueRef> {
  _visited = new Set();

  constructor(dp) {
    super('values', dp);
  }

  add(entries) {
    // add entries to collection
    super.add(entries);

    // deserialize
    for (const entry of entries) {
      this._deserialize(entry);
    }
  }

  getAllById(ids) {
    return ids.map(id => this.getById(id));
  }

  _deserialize(entry) {
    this._deserializeValue(entry);
    // entry.valueString = JSON.stringify(entry.value);
    delete entry.serialized; // don't need this, so don't keep it around
  }

  /**
   * NOTE: This still only returns a string representation?
   */
  _deserializeValue(entry) {
    if (!entry.value) {
      if (this._visited.has(entry)) {
        return '(circular reference)';
      }
      this._visited.add(entry);

      // NOTE: if `undefined`, object property is not actually sent/received via SocketIO?
      // if (!('serialized' in entry)) {
      //   logError(`error when deserializing value #${entry.valueId} (data missing): ${JSON.stringify(entry)}`);
      //   entry.category = ValueTypeCategory.String;
      //   entry.pruneState = ValuePruneState.Omitted;
      //   return entry.value = '(error when deserializing)';
      // }

      const {
        category,
        serialized,
        pruneState
      } = entry;

      let value;
      if (pruneState === ValuePruneState.Omitted) {
        value = serialized;
      }
      else {
        switch (category) {
          case ValueTypeCategory.Array: {
            value = this.getAllById(entry.serialized);
            value = value.map(child => this._deserializeValue(child));
            break;
          }
          case ValueTypeCategory.Object: {
            value = {};
            for (const [key, childId] of entry.serialized) {
              const child = this.getById(childId);
              value[key] = this._deserializeValue(child);
            }
            break;
          }
          default:
            value = serialized;
            break;
        }
      }
      entry.value = value;
    }

    return entry.value;
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
  /**
   * @type {StaticProgramContext}
   */
  application;

  /**
   * @type {DataProviderUtil}
   */
  util;

  constructor(application) {
    this.application = application;

    // NOTE: we have to hardcode these so we get Intellisense
    this.collections = {
      staticProgramContexts: new StaticProgramContextCollection(this),
      staticContexts: new StaticContextCollection(this),
      staticTraces: new StaticTraceCollection(this),

      executionContexts: new ExecutionContextCollection(this),
      traces: new TraceCollection(this),
      values: new ValueCollection(this)
    };

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

  _notifyData(collectionName: string, data: [], allListeners) {
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
