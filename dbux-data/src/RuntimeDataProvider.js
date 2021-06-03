import path from 'path';
import findLastIndex from 'lodash/findLastIndex';
import { newLogger } from '@dbux/common/src/log/logger';
import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import Trace from '@dbux/common/src/core/data/Trace';
import ValueRef from '@dbux/common/src/core/data/ValueRef';
import StaticProgramContext from '@dbux/common/src/core/data/StaticProgramContext';
import StaticContext from '@dbux/common/src/core/data/StaticContext';
import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import ValueTypeCategory, { ValuePruneState } from '@dbux/common/src/core/constants/ValueTypeCategory';
import { isTracePop, isTraceFunctionExit, isBeforeCallExpression, isTraceThrow } from '@dbux/common/src/core/constants/TraceType';
import { hasCallId, isCallResult, isCallExpressionTrace } from '@dbux/common/src/core/constants/traceCategorization';

import Collection from './Collection';

import DataProviderBase from './DataProviderBase';
import DataProviderUtil from './dataProviderUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DataProvider');

/** @typedef {import('../../dbux-common/src/core/data/PromiseData').default} PromiseData */

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

function deleteCachedRange(locObj) {
  delete locObj._range;
  delete locObj.start._pos;
  delete locObj.end._pos;
  return locObj;
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

  serialize(staticProgramContext) {
    const staticProgramContextData = { ...staticProgramContext };
    staticProgramContextData.relativeFilePath = path.relative(this.dp.application.entryPointPath, staticProgramContext.filePath).replace(/\\/g, '/');
    delete staticProgramContextData.filePath;
    return staticProgramContextData;
  }

  deserialize(staticProgramContextData) {
    const staticProgramContext = { ...staticProgramContextData };
    staticProgramContext.filePath = path.join(this.dp.application.entryPointPath, staticProgramContext.relativeFilePath);
    delete staticProgramContext.relativeFilePath;
    return staticProgramContext;
  }
}

/**
 * @extends {Collection<StaticContext>}
 */
class StaticContextCollection extends Collection {
  constructor(dp) {
    super('staticContexts', dp);
  }

  serialize(staticContext) {
    const staticContextData = { ...staticContext };
    delete staticContextData.filePath;
    deleteCachedRange(staticContextData.loc);
    return staticContextData;
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

  serialize(staticTrace) {
    const staticTraceData = { ...staticTrace };
    deleteCachedRange(staticTraceData.loc);
    return staticTraceData;
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
    this.currentThreadCount = 1;
  }

  add(entries) {
    for (const entry of entries) {
      // if (!entry.parentContextId) {
      //   // set applicationId, so we can trace any data point back to it's application
      //   entry.applicationId = this.dp.application.applicationId;
      // }

      entry.applicationId = this.dp.application.applicationId;
    }
    super.add(entries);
  }

  // /**
  //  * @param {ExecutionContext[]} contexts 
  //  */
  // postIndex(contexts) {
  //   try {
  //     // determine last trace of every context
  //     this.resolveLastTraceOfContext(contexts);
  //   }
  //   catch (err) {
  //     logError('resolveLastTraceOfContext failed', err); //contexts);
  //   }
  // }

  // resolveLastTraceOfContext() {
  //   // TODO
  //   // return !isReturnTrace(traceType) && !isTracePop(traceType) &&   // return and pop traces indicate that there was no error in that context
  //   //   dp.util.isLastTraceInContext(traceId) &&        // is last trace we have recorded
  //   //   !dp.util.isLastTraceInStaticContext(traceId);   // but is not last trace in the code
  // }
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

  serialize(trace) {
    const traceData = { ...trace };
    delete traceData._valueString;
    delete traceData._valueStringShort;

    // these properties will be resolved on addData, don't need to store them
    delete traceData.applicationId;
    delete traceData.codeChunkId;
    delete traceData.staticTraceIndex;
    return traceData;
  }

  /**
   * Post processing of trace data
   * @param {Trace[]} traces
   */
  postAddRaw(traces) {
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

  logCallResolveError(traceId, staticTrace, beforeCall, beforeCalls) {
    const stackInfo = beforeCalls.map(t => t &&
      `#${t?.staticTraceId} ${this.dp.collections.staticTraces.getById(t.staticTraceId)?.displayName || '(no staticTrace found)'}` ||
      '(null)');

    // eslint-disable-next-line max-len
    logError(`Could not resolve resultCallId for trace #${staticTrace.staticTraceId} "${staticTrace.displayName}" (traceId ${traceId}). resultCallId ${staticTrace.resultCallId} not matching beforeCall.staticTraceId #${beforeCall?.staticTraceId || 'NA'}. BCE Stack:\n  ${stackInfo.join('\n  ')}`);
  }

  makeStaticTraceInfo(st) {
    return `"${st?.displayName}" (${st.callId}, ${st?.staticTraceId}, ${st?._traceId})`;
  }

  makeTraceInfo(trace) {
    const { traceId } = trace;
    const st = this.dp.util.getStaticTrace(traceId);
    const traceType = this.dp.util.getTraceType(traceId);
    const typeName = TraceType.nameFrom(traceType);
    return `[${typeName}] ${this.makeStaticTraceInfo(st)}`;
  }

  // checkLogInconsistentTrace(trace, stOrig) {
  //   const { traceId } = trace;
  //   const st = this.dp.util.getStaticTrace(traceId);

  //   const { /* traceId, */ staticTraceId } = trace;
  //   stOrig = this.dp.collections.staticTraces.getById(staticTraceId);

  //   if (stOrig && st !== stOrig) {
  //     logError(`inconsistent trace has two different STs: ${this.makeStaticTraceInfo(stOrig)} vs. ${this.makeStaticTraceInfo(st)}`);
  //     return true;
  //   }
  //   return false;
  // }

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
          if (staticTrace.resultCallId !== beforeCall?.staticTraceId) {
            // maybe something did not get popped. Let's look for it directly!
            const idx = findLastIndex(beforeCalls, bce => bce.staticTraceId === staticTrace.resultCallId);
            if (idx >= 0) {
              // it's on the stack - just take it (and also push the wrong one back)
              beforeCalls.push(beforeCall);
              beforeCall = beforeCalls[idx];
              beforeCalls.splice(idx, 1);
            }
            else {
              // it's just not there...
              beforeCalls.push(beforeCall);   // something is wrong -> push it back

              // log error
              this.logCallResolveError(traceId, staticTrace, beforeCall, beforeCalls);

              // unset beforeCall
              beforeCall = null;
            }
          }
          else if (!beforeCall) {
            // log error
            this.logCallResolveError(traceId, staticTrace, beforeCall, beforeCalls);
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
            // if (!this.checkLogInconsistentTrace(trace, staticTrace)) 
            // {
            // eslint-disable-next-line max-len
            logError(`[${this.dp.util.getTraceProgramPath(traceId)}] [callId missing] beforeCall.callId !== staticTrace.staticTraceId - ${this.makeTraceInfo(beforeCall)} !== ${this.makeTraceInfo(trace)}`, '- is trace participating in a CallExpression-tree? [', staticTrace.displayName, `][${JSON.stringify(staticTrace.loc)}]. Stack staticTraces: ${beforeCalls.map(t =>
              this.makeStaticTraceInfo(t.staticTraceId)
            )}`);
            // }
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
        contextId,
        previousTrace: previousTraceId
      } = trace;

      // if traces were disabled, there is nothing to do here
      if (!this.dp.util.isContextTraced(contextId)) {
        continue;
      }

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
          // // WARNING: the "+1" heuristic easily fails. E.g. in case of `IfStatement`, where `test` is visited after the blocks.
          // trace.staticTraceId = staticTraceId + 1;

          trace.staticTraceId = staticTraceId;
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
    if (entry === undefined) {
      logError(`_deserializeValue failed: entry not found`);
      return undefined;
    }
    if (!('value' in entry)) {
      if (this._visited.has(entry)) {
        return '(Dbux: circular reference)';
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
            for (let i = 0; i < entry.serialized.length; ++i) {
              const childId = entry.serialized[i];
              const child = this.getById(childId);
              if (!child) {
                warn(`Could not lookup array index "${i}" (id = "${childId}"): ${JSON.stringify(entry.serialized)}`);
                return '(Dbux: lookup failed)';
              }
              else {
                return this._deserializeValue(child);
              }
            }
            break;
          }
          case ValueTypeCategory.Object: {
            value = {};
            for (const [key, childId] of entry.serialized) {
              const child = this.getById(childId);
              if (!child) {
                value[key] = '(Dbux: lookup failed)';
                warn(`Could not lookup object property "${key}" (id = "${childId}"): ${JSON.stringify(entry.serialized)}`);
              }
              else {
                value[key] = this._deserializeValue(child);
              }
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
  /**
   * @type {DataProviderUtil}
   */
  util;

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
      values: new ValueCollection(this),
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
