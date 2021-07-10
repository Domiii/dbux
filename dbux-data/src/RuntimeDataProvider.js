import path from 'path';
import difference from 'lodash/difference';
import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import SpecialIdentifierType from '@dbux/common/src/core/constants/SpecialIdentifierType';
import SpecialObjectType from '@dbux/common/src/core/constants/SpecialObjectType';
import ValueTypeCategory, { isObjectCategory, ValuePruneState } from '@dbux/common/src/core/constants/ValueTypeCategory';
import TraceType, { isTracePop, isTraceFunctionExit, isBeforeCallExpression, isTraceThrow } from '@dbux/common/src/core/constants/TraceType';
import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import Trace from '@dbux/common/src/core/data/Trace';
import DataNode from '@dbux/common/src/core/data/DataNode';
import ValueRef from '@dbux/common/src/core/data/ValueRef';
import AsyncEvent from '@dbux/common/src/core/data/AsyncEvent';
import AsyncNode from '@dbux/common/src/core/data/AsyncNode';
import StaticProgramContext from '@dbux/common/src/core/data/StaticProgramContext';
import StaticContext from '@dbux/common/src/core/data/StaticContext';
import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import { isCallResult, isCallExpressionTrace } from '@dbux/common/src/core/constants/traceCategorization';
import EmptyObject from '@dbux/common/src/util/EmptyObject';

import Collection from './Collection';

import DataProviderBase from './DataProviderBase';
import DataProviderUtil from './dataProviderUtil';


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

  /**
   * NOTE: This will execute before `DataNodeCollection.postIndexRaw`
   */
  postIndexRaw(entries) {
    this.errorWrapMethod('setParamInputs', entries);
    this.errorWrapMethod('setCallExpressionResultInputs', entries);
  }

  /**
   * Set Param trace `inputs` to `[argNodeId]`.
   */
  setParamInputs(contexts) {
    const { dp: { util } } = this;
    for (const { contextId } of contexts) {
      const paramTraces = util.getTracesOfContextAndType(contextId, TraceType.Param);
      if (!paramTraces.length) {
        // function has no parameters -> nothing to do
        continue;
      }
      const bceTrace = util.getOwnCallerTraceOfContext(contextId); // BCE
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

  /**
   * Set CallExpression result trace `inputs` to `[returnNodeId]`.
   */
  setCallExpressionResultInputs(contexts) {
    const { dp, dp: { util } } = this;
    for (const { contextId } of contexts) {
      const returnTraces = util.getTracesOfContextAndType(contextId, TraceType.ReturnArgument);
      if (!returnTraces.length) {
        // function has no return value -> nothing to do
        continue;
      }
      else if (returnTraces.length > 1) {
        this.logger.error(`Found context containing more than one ReturnArgument. contextId: ${contextId}, ReturnArgument ids: [${returnTraces}]`);
        continue;
      }

      const returnTrace = returnTraces[0];

      const bceTrace = util.getOwnCallerTraceOfContext(contextId); // BCE
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
    this.errorWrapMethod('registerResultId', traces);
    this.errorWrapMethod('registerValueRefSpecialObjectType', traces);
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

  registerValueRefSpecialObjectType(traces) {
    for (const trace of traces) {
      const { staticTraceId, nodeId } = trace;
      const staticTrace = this.dp.collections.staticTraces.getById(staticTraceId);
      if (staticTrace.data?.specialType === SpecialIdentifierType.Arguments) {
        const dataNode = this.dp.collections.dataNodes.getById(nodeId);
        const valueRef = this.dp.collections.values.getById(dataNode.refId);
        if (valueRef) {
          valueRef.specialObjectType = SpecialObjectType.Arguments;
        }
        else {
          this.logger.warn(`Cannot register SpecialObjectType for Argument trace, valueRef not found. trace: ${trace}, dataNode: ${dataNode}`);
        }
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
      const trace = this.dp.collections.traces.getById(traceId);
      const staticTrace = this.dp.collections.staticTraces.getById(trace.staticTraceId);

      if (dataNode.inputs?.length && staticTrace.dataNode && !staticTrace.dataNode.isNew) {
        const inputDataNode = this.dp.collections.dataNodes.getById(dataNode.inputs[0]);
        return inputDataNode.valueId;
      }

      const lastNode = this.dp.indexes.dataNodes.byAccessId.getLast(accessId);
      if (accessId && lastNode) {
        // warn(`[getValueId] Cannot find accessId of dataNode: ${JSON.stringify(dataNode)}`);
        // NOTE: currently, last in `byAccessId` index is actually "the last before this one", since we are still resolving the index.
        return lastNode.valueId;
      }

      const { contextId } = trace;
      const { specialObjectType } = this.dp.util.getDataNodeValueRef(dataNode.varAccess?.objectNodeId) || EmptyObject;
      if (specialObjectType) {
        // NOTE: specialObjectType is looked up by `valueId`
        const SpecialObjectTypeHandlers = {
          [SpecialObjectType.Arguments]: ({ varAccess: { prop } }) => {
            const callerTrace = this.dp.util.getOwnCallerTraceOfContext(contextId);
            if (callerTrace) {
              // NOTE: sometimes, (e.g. in root contexts) we might not have an "own" caller trace
              return this.dp.util.getCallArgDataNodes(callerTrace.traceId)[prop].valueId;
            }
            return null;
          }
        };
        const specialValueId = SpecialObjectTypeHandlers[specialObjectType](dataNode);
        if (specialValueId) {
          return specialValueId;
        }
      }

      // eslint-disable-next-line max-len
      // this.logger.warn(`[getValueId] Cannot find valueId for dataNode.\n    trace: ${this.dp.util.makeTraceInfo(traceId)}\n    dataNode: ${JSON.stringify(dataNode)}`);

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
      const { declarationTid, objectNodeId, prop } = varAccess;
      if (declarationTid) {
        key = declarationTid;
      }
      else if (objectNodeId) {
        const objectDataNode = this.dp.collections.dataNodes.getById(objectNodeId);
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

/**
 * @extends {Collection<AsyncEvent>}
 */
class AsyncEventCollection extends Collection {
  constructor(dp) {
    super('asyncEvents', dp);
  }
}

/**
 * @extends {Collection<AsyncNode>}
 */
class AsyncNodeCollection extends Collection {
  constructor(dp) {
    super('asyncNodes', dp);
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
      values: new ValueRefCollection(this),
      asyncNodes: new AsyncNodeCollection(this),
      asyncEvents: new AsyncEventCollection(this)
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
    const requireInfo = `Newly required external modules (${newRequireModuleNames.length}/${allRequireModuleNames.length}):\n  ${newRequireModuleNames.join(',')}`;

    // program stats
    const programData = collectionStats.staticProgramContexts;
    const minProgramId = programData?.min;
    const allModuleNames = this.util.getAllExternalProgramModuleNames();
    const newModuleNames = minProgramId && this.util.getAllExternalProgramModuleNames(minProgramId);
    const moduleInfo = `Newly traced external modules (${newModuleNames?.length || 0}/${allModuleNames.length}):\n  ${newModuleNames?.join(',') || ''}`;

    const allMissingModules = difference(allRequireModuleNames, allModuleNames);
    const newMissingModules = difference(newRequireModuleNames, allModuleNames);
    const missingModuleInfo = newMissingModules.length &&
      `Required but untraced external modules (${newMissingModules.length}/${allMissingModules.length}):\n  ${newMissingModules.join(',')}`;

    // final message
    const msgs = [
      `##### Data received #####\nCollection Data:\n ${collectionInfo}`,
      '',
      requireInfo,
      moduleInfo,
      missingModuleInfo
    ];
    this.logger.debug(msgs.join('\n'));
  }
}
