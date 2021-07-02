import path from 'path';
import difference from 'lodash/difference';
import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import Trace from '@dbux/common/src/core/data/Trace';
import DataNode from '@dbux/common/src/core/data/DataNode';
import ValueRef from '@dbux/common/src/core/data/ValueRef';
import StaticProgramContext from '@dbux/common/src/core/data/StaticProgramContext';
import StaticContext from '@dbux/common/src/core/data/StaticContext';
import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import { isObjectCategory, ValuePruneState } from '@dbux/common/src/core/constants/ValueTypeCategory';
import TraceType, { isTracePop, isTraceFunctionExit, isTraceThrow } from '@dbux/common/src/core/constants/TraceType';

import Collection from './Collection';

import DataProviderBase from './DataProviderBase';
import DataProviderUtil from './dataProviderUtil';

// eslint-disable-next-line no-unused-vars
// const { log, debug, warn, error: logError } = newLogger('DataProvider');

function deleteCachedRange(locObj) {
  delete locObj._range;
  delete locObj.start._pos;
  delete locObj.end._pos;
  return locObj;
}


// ###########################################################################
// StaticProgramContextCollection
// ###########################################################################

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
        this.logger.error('invalid `staticProgramContext.filePath` is not absolute - don\'t know how to resolve', entry.fileName);
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


// ###########################################################################
// StaticTraceCollection
// ###########################################################################

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

// ###########################################################################
// ExecutionContextCollection
// ###########################################################################

/**
 * @extends {Collection<ExecutionContext>}
 */
class ExecutionContextCollection extends Collection {
  constructor(dp) {
    super('executionContexts', dp);
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

  /**
   * NOTE: This will execute before `DataNodeCollection.postIndexRaw`
   */
  postIndexRaw(entries) {
    this.errorWrapMethod('setParamInputs', entries);
    this.errorWrapMethod('setCallExpressionResultInputs', entries);
  }

  setParamInputs(contexts) {
    const { dp, dp: { util } } = this;
    for (const { contextId } of contexts) {
      const paramTraces = util.getTracesOfContextAndType(contextId, TraceType.Param);
      if (!paramTraces.length) {
        // function has no parameters -> nothing to do
        continue;
      }
      const bceTrace = util.getCallerTraceOfContext(contextId); // BCE
      if (!bceTrace) {
        // no BCE -> must be root context (not called by us) -> nothing to do
        continue;
      }
      const callId = bceTrace.traceId;
      if (!bceTrace.data) {
        // TODO: odd bug
        this.logger.warn(`bceTrace.data is missing in "setParamInputs" for trace "${util.makeTraceInfo(callId)}"`);
        continue;
      }

      // get `argDataNodes` (flattened, in case of spread)
      const argDataNodes = this.dp.util.getCallArgDataNodes(callId);

      // add to `Param` trace's `inputs`
      for (let i = 0; i < paramTraces.length; i++) {
        const paramTrace = paramTraces[i];
        const argDataNode = argDataNodes[i];
        if (argDataNode) {
          const paramDataNodes = util.getDataNodesOfTrace(paramTrace.traceId);
          paramDataNodes[0].inputs = [argDataNode.nodeId];
        }
        else {
          // NOTE: this parameter did not have a corresponding argument
        }
      }

      // TODO: `RestElement`
    }
  }

  setCallExpressionResultInputs(contexts) {
    const { dp, dp: { util } } = this;
    for (const { contextId } of contexts) {
      const returnTraces = util.getTracesOfContextAndType(contextId, TraceType.ReturnArgument);
      if (!returnTraces.length) {
        // function has no return value -> nothing to do
        continue;
      }
      else if (returnTraces.length > 1) {
        this.logger.error(`Found context containing more than one CER trace. contextId: ${contextId}, CER traceIds: [${returnTraces}]`);
        continue;
      }

      const returnTrace = returnTraces[0];

      const bceTrace = util.getCallerTraceOfContext(contextId); // BCE
      if (!bceTrace) {
        // no BCE -> must be root context (not called by us) -> nothing to do
        continue;
      }
      const cerTrace = dp.collections.traces.getById(bceTrace.resultId);

      if (!cerTrace) {
        // NOTE: function was called, but did not have CER. Possible due to exceptions etc.
      }
      else {
        const cerDataNode = dp.collections.dataNodes.getById(cerTrace.nodeId);
        cerDataNode.inputs = [returnTrace.nodeId];
      }
    }
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

// ###########################################################################
// TraceCollection
// ###########################################################################

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

    // debug(`traces`, JSON.stringify(traces, null, 2));

    super.add(traces);
  }

  serialize(trace) {
    const traceData = { ...trace };
    delete traceData._valueString;
    delete traceData._valueStringShort;
    return traceData;
  }

  /**
   * Post processing of trace data
   * @param {Trace[]} traces
   */
  postAddRaw(traces) {
    // build dynamic call expression tree
    this.errorWrapMethod('registerResultId', traces);
    this.errorWrapMethod('resolveCodeChunks', traces);
    this.errorWrapMethod('resolveCallIds', traces);
    this.errorWrapMethod('resolveErrorTraces', traces);
  }

  postIndexRaw(traces) {
    this.errorWrapMethod('resolveMonkeyCalls', traces);
  }

  registerResultId(traces) {
    for (const { traceId, resultCallId } of traces) {
      if (resultCallId) {
        const bceTrace = this.dp.collections.traces.getById(resultCallId);
        bceTrace.resultId = traceId;
      }
    }
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
    this.logger.error(`Could not resolve resultCallId for trace #${staticTrace.staticTraceId} "${staticTrace.displayName}" (traceId ${traceId}). resultCallId ${staticTrace.resultCallId} not matching beforeCall.staticTraceId #${beforeCall?.staticTraceId || 'NA'}. BCE Stack:\n  ${stackInfo.join('\n  ')}`);
  }

  resolveCallIds(traces) {
    for (const trace of traces) {
      const { traceId: callId } = trace;

      const argTraces = this.dp.util.getCallArgTraces(callId);
      if (argTraces) {
        // BCE
        argTraces.forEach(t => t.callId = callId);
      }
    }
  }

  resolveMonkeyCalls(traces) {
    for (const trace of traces) {
      const { traceId: callId, data } = trace;
      const monkey = data?.monkey;
      if (monkey?.wireInputs) {
        // NOTE: BCE was monkey patched, and generated it's own set of `DataNode`s, one per argument
        // Link BCE's new DataNode to argument input node

        // get `argDataNodes` (flattened, in case of spread)
        const monkeyDataNodes = this.dp.util.getDataNodesOfTrace(callId);
        const argDataNodes = this.dp.util.getCallArgDataNodes(callId);

        if (!monkeyDataNodes || !argDataNodes) {
          continue;
        }

        // wire monkey <-> arg DataNodes (should be 1:1)
        for (let i = 0; i < monkeyDataNodes.length; i++) {
          const monkeyDataNode = monkeyDataNodes[i];
          const argDataNode = argDataNodes[i];

          // NOTE: argDataNode might be missing (e.g. because it had a "dbux disable" instruction)
          argDataNode && (monkeyDataNode.inputs = [argDataNode.nodeId]);
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
        // NOTE: interruptable contexts only have `Push` and `Pop` traces.
        //    Everything else (including error handling!) is in `Resume` children.
        continue;
      }

      const previousTraceType = this.dp.util.getTraceType(previousTraceId);
      if (!isTraceFunctionExit(previousTraceType)) {
        // before pop must be a function exit trace, else -> error!
        trace.error = true;

        this.logger.debug(`ERROR trace: ${this.dp.util.makeTraceInfo(trace)}`);

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
            this.logger.error('last (non-result) call trace in error context has `resultId`', callTrace.resultId, callTrace);
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

// ###########################################################################
// DataNodeCollection
// ###########################################################################

/**
 * @extends {Collection<DataNode>}
 */
class DataNodeCollection extends Collection {
  constructor(dp) {
    super('dataNodes', dp);
    this.accessUIdMap = new Map();
  }

  /**
   * @param {DataNode} dataNode
   */
  getValueId(dataNode) {
    if ('valueId' in dataNode) {
      return dataNode.valueId;
    }

    if (dataNode.refId) {
      const firstRef = this.dp.indexes.dataNodes.byRefId.getFirst(dataNode.refId);
      return firstRef.traceId;
    }
    else {
      const { traceId, accessId } = dataNode;
      // const traceType = this.dp.util.getTraceType(traceId);
      const trace = this.dp.collections.traces.getById(traceId);
      // const staticTrace = this.dp.collections.staticTraces.getById(trace.staticTraceId);
      let lastNode;
      // if (TraceType.is.BeforeCallExpression(traceType)) {
      //   // skip in this case, special handling in UI - BCE rendering should reflect CallExpressionResult
      //   return null;
      // }
      // if (staticTrace.dataNode.isNew) {
      //   return traceId;
      // }
      if (dataNode.inputs?.length) {
        const inputDataNode = this.dp.collections.dataNodes.getById(dataNode.inputs[0]);
        return inputDataNode.valueId;
      }
      // else if (TraceType.is.Identifier(traceType) || TraceType.is.ME(traceType)) {
      else if (accessId && (lastNode = this.dp.indexes.dataNodes.byAccessId.getLast(accessId))) {
        // warn(`[getValueId] Cannot find accessId of dataNode: ${JSON.stringify(dataNode)}`);
        // NOTE: currently, last in `byAccessId` index is actually "the last before this one", since we are still resolving the index.
        return lastNode.valueId;
      }
      else {
        // eslint-disable-next-line max-len
        // this.logger.warn(`[getValueId] Cannot find valueId for empty inputs.\n    trace: ${this.dp.util.makeTraceInfo(traceId)}\n    dataNode: ${JSON.stringify(dataNode)}`);
      }
      return traceId;
    }
  }

  getAccessId(dataNode) {
    if ('accessId' in dataNode) {
      return dataNode.accessId;
    }

    const { varAccess } = dataNode;
    if (!varAccess) {
      return null;
    }
    else {
      let key;
      const { declarationTid, objctNodeId, prop } = varAccess;
      if (declarationTid) {
        key = declarationTid;
      }
      else if (objctNodeId) {
        const objectDataNode = this.dp.collections.dataNodes.getById(objctNodeId);
        const objectValueId = objectDataNode.valueId;
        if (!objectValueId) {
          // sanity check
          this.logger.warn(`[getAccessId] Cannot find objectValueId of dataNode: ${JSON.stringify(dataNode)}`);
          key = null;
        }
        else {
          key = `${objectValueId}#${prop}`;
        }
      }
      else {
        const { traceId } = dataNode;
        const traceInfo = this.dp.util.makeTraceInfo(traceId);
        this.logger.error(`Trying to generate accessId with illegal dataNode: ${JSON.stringify(dataNode)}\n  at trace: ${traceInfo}`);
        return null;
      }

      if (!this.accessUIdMap.get(key)) {
        this.accessUIdMap.set(key, this.accessUIdMap.size + 1);
      }
      return this.accessUIdMap.get(key);
    }
  }

  postIndexProcessed(dataNodes) {
    this.errorWrapMethod('resolveDataIds', dataNodes);
  }

  /**
   * Resolves `accessId` and `valueId` simultaneously.
   * Manually add the index entries (because this is run `postIndex`).
   * @param {DataNode[]} dataNodes 
   */
  resolveDataIds(dataNodes) {
    for (const dataNode of dataNodes) {
      dataNode.accessId = this.getAccessId(dataNode);
      dataNode.valueId = this.getValueId(dataNode);
      this.dp.indexes.dataNodes.byAccessId.addEntry(dataNode);
      this.dp.indexes.dataNodes.byValueId.addEntry(dataNode);
    }
  }
}

// ###########################################################################
// ValueRefCollection
// ###########################################################################

/**
 * @extends {Collection<ValueRef>}
 */
class ValueRefCollection extends Collection {
  _visited = new Set();

  constructor(dp) {
    super('values', dp);
  }

  postAddRaw(entries) {
    // deserialize
    this.errorWrapMethod('deserializeShallow', entries);
  }

  getAllById(ids) {
    return ids.map(id => this.getById(id));
  }

  deserializeShallow(valueRefs) {
    for (let valueRef of valueRefs) {
      if (!('value' in valueRef)) {
        const {
          nodeId,
          category,
          serialized,
          pruneState
        } = valueRef;
  
        if (pruneState !== ValuePruneState.Omitted && isObjectCategory(category)) {
          // map: [childRefId, childValue] => [(creation)nodeId, childRefId, childValue]
          valueRef.value = Object.fromEntries(Object.entries(serialized).map(([key, childEntry]) => [key, [nodeId, ...childEntry]]));
        }
        else {
          valueRef.value = serialized;
        }
        delete valueRef.serialized;
      }
    }
  }
}


// ###########################################################################
// RDP
// ###########################################################################

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
      dataNodes: new DataNodeCollection(this),
      values: new ValueRefCollection(this)
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

  addData(data, isRaw = true) {
    const oldRequireModuleNames = this.util.getAllRequireModuleNames();
    const result = super.addData(data, isRaw);

    this._reportNewDataStats(data, oldRequireModuleNames);

    return result;
  }

  _reportNewDataStats(data, oldRequireModuleNames) {
    const collectionStats = Object.fromEntries(
      Object.entries(data)
        .map(([key, arr]) => ([key, {
          len: arr.length,
          min: minBy(arr, entry => entry._id)?._id,
          max: maxBy(arr, entry => entry._id)?._id
        }]))
    );

    // collection stats
    const collectionInfo = Object.entries(collectionStats)
      .map(([key, { len, min, max }]) => `${len} ${key} (${min}~${max})`)
      .join('\n ');

    // require stats
    // TODO: import + dynamic `import``
    const allRequireModuleNames = this.util.getAllRequireModuleNames();
    const newRequireModuleNames = difference(allRequireModuleNames, oldRequireModuleNames);
    const requireInfo = `Newly required external modules (${newRequireModuleNames.length}/${allRequireModuleNames.length}): ${newRequireModuleNames.join(', ')}`;

    // program stats
    const programData = collectionStats.staticProgramContexts;
    const minProgramId = programData?.min;
    const allModuleNames = this.util.getAllExternalProgramModuleNames();
    const newModuleNames = minProgramId && this.util.getAllExternalProgramModuleNames(minProgramId);
    const moduleInfo = `Newly traced external modules (${newModuleNames?.length || 0}/${allModuleNames.length}): ${newModuleNames?.join(', ') || ''}`;

    const allMissingModules = difference(allRequireModuleNames, allModuleNames);
    const newMissingModules = difference(newRequireModuleNames, allModuleNames);
    const missingModuleInfo = newMissingModules.length &&
      `Required but untraced external modules (${newMissingModules.length}/${allMissingModules.length}): ${newMissingModules.join(', ')}`;

    // final message
    const msgs = [
      `##### Data received #####\nCollection Data:\n ${collectionInfo}`,
      '',
      requireInfo,
      moduleInfo,
    ];
    missingModuleInfo && msgs.push(missingModuleInfo);
    this.logger.debug(msgs.join('\n'));
  }
}
