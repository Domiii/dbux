import path from 'path';
import pull from 'lodash/pull';
import { newLogger } from '@dbux/common/src/log/logger';
import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import Trace from '@dbux/common/src/core/data/Trace';
import ValueRef from '@dbux/common/src/core/data/ValueRef';
import StaticProgramContext from '@dbux/common/src/core/data/StaticProgramContext';
import StaticContext from '@dbux/common/src/core/data/StaticContext';
import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import ValueTypeCategory, { ValuePruneState } from '@dbux/common/src/core/constants/ValueTypeCategory';
import TraceType, { isTraceExpression, isTracePop, isTraceFunctionExit, isBeforeCallExpression, isTraceThrow } from '@dbux/common/src/core/constants/TraceType';
import { hasCallId, isCallResult, isCallExpressionTrace } from '@dbux/common/src/core/constants/traceCategorization';

import Collection from './Collection';
import Queries from './queries/Queries';
import Indexes from './indexes/Indexes';

import DataProviderUtil from './dataProviderUtil';
import DataProviderBase from './DataProviderBase';

// eslint-disable-next-line no-unused-vars
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

/**
 * @extends {Collection<StaticProgramContext>}
 */
class StaticProgramContextCollection extends Collection {
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

/**
 * @extends {Collection<StaticContext>}
 */
class StaticContextCollection extends Collection {
  constructor(dp) {
    super('staticContexts', dp);
  }
}

/**
 * @extends {Collection<StaticTrace>}
 */
class StaticTraceCollection extends Collection {
  // lastStaticContextId = 0;
  // lastStaticCodeChunkId = 0;

  constructor(dp) {
    super('staticTraces', dp);
  }

  // handleEntryAdded(staticTrace) {
  //   const {
  //     staticContextId
  //   } = staticTrace;

  //   // TODO: add new StaticCodeChunkCollection to also manage code-chunk related information, especially: `loc`

  //   if (staticContextId !== this.lastStaticContextId) {
  //     // new code chunk
  //     ++this.lastStaticCodeChunkId;
  //     this.lastStaticContextId = staticContextId;
  //   }
  //   staticTrace.staticCodeChunkId = this.lastStaticCodeChunkId;
  // }
}

/**
 * @extends {Collection<ExecutionContext>}
 */
class ExecutionContextCollection extends Collection {
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


/**
 * @extends {Collection<Trace>}
 */
class TraceCollection extends Collection {
  lastContextId = -1;
  lastCodeChunkId = 0;

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
   * @param {Trace[]} traces
   */
  postAdd(traces) {
    // build dynamic call expression tree
    errorWrapMethod(this, 'resolveCodeChunks', traces);
    errorWrapMethod(this, 'resolveCallIds', traces);
    errorWrapMethod(this, 'resolveErrorTraces', traces);
  }

  resolveCodeChunks(traces) {
    for (const trace of traces) {
      const {
        contextId
      } = trace;

      const context = this.dp.collections.executionContexts.getById(contextId);
      const { staticContextId } = context;

      // codeChunkId
      // if (contextId !== this.dp.lastContextId) {
      //   // new code chunk
      //   ++this.lastCodeChunkId;
      //   this.lastContextId = contextId;
      // }
      // trace.codeChunkId = this.lastCodeChunkId;

      // TODO: split + organize code chunks along "deep splits"?
      // TODO: how to re-split an already established chunk?
      trace.codeChunkId = staticContextId;
    }
  }

  /**
   * TODO: This will not work with asynchronous call expressions (which have `await` arguments).
   * @param {Trace[]} traces
   */
  resolveCallIds(traces) {
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

              // eslint-disable-next-line max-len
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
            // eslint-disable-next-line max-len
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

/**
 * @extends {Collection<ValueRef>}
 */
class ValueCollection extends Collection {
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

export default class RuntimeDataProvider extends DataProviderBase {
  constructor(application) {
    super('RuntimeDataProvider');

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
  }
}
