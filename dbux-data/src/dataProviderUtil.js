import findLast from 'lodash/findLast';
import groupBy from 'lodash/groupBy';
import TraceType, { hasDynamicTypes, isTracePop, isBeforeCallExpression } from '@dbux/common/src/types/constants/TraceType';
import SpecialIdentifierType from '@dbux/common/src/types/constants/SpecialIdentifierType';
import { pushArrayOfArray } from '@dbux/common/src/util/arrayUtil';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import DataNodeType, { isDataNodeModifyType } from '@dbux/common/src/types/constants/DataNodeType';
import StaticTrace from '@dbux/common/src/types/StaticTrace';
import { isVirtualContextType } from '@dbux/common/src/types/constants/StaticContextType';
import { isRealContextType } from '@dbux/common/src/types/constants/ExecutionContextType';
import { isCallResult, hasCallId } from '@dbux/common/src/types/constants/traceCategorization';
import ValueTypeCategory, { isObjectCategory, isPlainObjectOrArrayCategory, isFunctionCategory, ValuePruneState } from '@dbux/common/src/types/constants/ValueTypeCategory';
import { parseNodeModuleName } from '@dbux/common-node/src/util/pathUtil';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import AsyncEventUpdateType from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import { locToString } from './util/misc';

/**
 * @typedef {import('./RuntimeDataProvider').default} DataProvider
 */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dataProviderUtil');

export default {

  // ###########################################################################
  // Program utils
  // ###########################################################################
  /** @param {DataProvider} dp */
  getFilePathFromProgramId(dp, programId) {
    return dp.collections.staticProgramContexts.getById(programId)?.filePath || null;
  },

  /** 
   * @param {DataProvider} dp
   * @return {Array.<string>} Names of all modules from `node_modules` folders that were executed.
   */
  getExternalProgramModuleName(dp, programId) {
    const programContext = dp.collections.staticProgramContexts.getById(programId);

    if ('_moduleName' in programContext) {
      return programContext._moduleName;
    }
    else {
      return programContext._moduleName = parseNodeModuleName(programContext.filePath);
    }
  },

  getAllExternalProgramModuleNames(dp, startId = 1) {
    const programIds = new Set(
      dp.collections.staticProgramContexts
        .getAllActual(startId)
        .map(p => dp.util.getExternalProgramModuleName(p.programId))
    );

    // NOTE: `getExternalProgramModuleName` returns null if a program is not in `node_modules`.
    programIds.delete(null);

    return Array.from(programIds);
  },

  // ###########################################################################
  // contexts
  // ###########################################################################

  /** @param {DataProvider} dp */
  getAllRootContexts(dp) {
    return dp.indexes.executionContexts.roots.get(1);
  },

  /** @param {DataProvider} dp */
  getRootContextOfContext(dp, contextId) {
    const { executionContexts } = dp.collections;
    let lastContextId = contextId;
    let parentContextId;
    while ((parentContextId = executionContexts.getById(lastContextId).parentContextId)) {
      lastContextId = parentContextId;
    }
    return executionContexts.getById(lastContextId);
  },

  /** @param {DataProvider} dp */
  getRootContextOfTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    return dp.util.getRootContextOfContext(trace.contextId);
  },

  /** @param {DataProvider} dp */
  getFirstContextsInRuns(dp) {
    return dp.indexes.executionContexts.firstInRuns.get(1);
  },

  /**
   * @param {DataProvider} dp 
   */
  getRootContextsByRun(dp, runId) {
    return dp.indexes.executionContexts.rootsByRun.get(runId);
  },

  /** @param {DataProvider} dp */
  isRootContextInRun(dp, contextId) {
    const { parentContextId, runId } = dp.collections.executionContexts.getById(contextId);
    if (parentContextId) {
      const parentContext = dp.collections.executionContexts.getById(parentContextId);
      if (runId === parentContext.runId) {
        return false;
      }
    }
    return true;
  },

  /** @param {DataProvider} dp */
  getFirstTracesInRuns(dp) {
    return dp.indexes.traces.firsts.get(1);
  },
  /**
   * Get all contexts in which an object of given `refId` has been recorded.
   * 
   * @param {DataProvider} dp
   */
  getContextsByRefId(dp, refId) {
    // get all participating traces
    const traces = dp.indexes.traces.byRefId.get(refId);

    // generate set of contexts of those traces
    const contextsSet = new Set();
    traces.forEach((trace) => {
      contextsSet.add(dp.collections.executionContexts.getById(trace.contextId));
    });
    return Array.from(contextsSet);
  },

  /** @param {DataProvider} dp */
  searchContexts(dp, searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    return dp.util.getAllExecutedStaticContexts().
      filter(staticContext => {
        return staticContext.displayName.toLowerCase().includes(searchTerm);
      }).
      map(staticContext =>
        dp.indexes.executionContexts.byStaticContext.get(staticContext.staticContextId)
      ).
      flat();
  },

  findContextsByTraceSearchTerm(dp, searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    return dp.util.getAllExecutedStaticContexts().
      filter(staticContext => {
        const staticTraces = dp.util.getExecutedStaticTracesInStaticContext(staticContext.staticContextId);
        return staticTraces.some(staticTrace =>
          staticTrace.displayName?.toLowerCase().includes(searchTerm)
        );
      }).
      map(staticContext =>
        dp.indexes.executionContexts.byStaticContext.get(staticContext.staticContextId)
      ).
      flat();
  },

  /** @param {DataProvider} dp */
  getContextModuleName(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const staticContext = dp.collections.staticContexts.getById(context.staticContextId);
    return dp.util.getExternalProgramModuleName(staticContext.programId);
  },

  // ###########################################################################
  // static contexts + static traces
  // ###########################################################################

  /** @param {DataProvider} dp */
  getStaticContextParent(dp, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const { parentId } = staticContext;
    return dp.collections.staticContexts.getById(parentId);
  },

  getAllExecutedStaticContextIds(dp) {
    // NOTE: needs improved performance, if used a lot
    const staticContextIds = new Set(
      dp.collections.executionContexts.getAll().map(context => {
        if (!context) {
          return 0;
        }

        const { staticContextId } = context;
        return staticContextId;
      })
    );
    staticContextIds.delete(0);
    return Array.from(staticContextIds);
  },

  getAllExecutedStaticContexts(dp) {
    const staticContextIds = dp.util.getAllExecutedStaticContextIds();
    return staticContextIds.map(staticContextId =>
      dp.collections.staticContexts.getById(staticContextId));
  },

  // getAllExecutedStaticTraces(dp) {
  //  // TODO: NIY
  // },

  getExecutedStaticTracesInStaticContext(dp, staticContextId) {
    return dp.indexes.staticTraces.byContext.get(staticContextId);
  },

  // ###########################################################################
  // run
  // ###########################################################################

  /** @param {DataProvider} dp */
  getRunCreatedAt(dp, runId) {
    return dp.indexes.executionContexts.byRun.get(runId)[0]?.createdAt || null;
  },

  // ###########################################################################
  // traces
  // ###########################################################################

  /** @param {DataProvider} dp */
  getTraceType(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const {
      staticTraceId,
      type: dynamicType
    } = trace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const {
      type: staticType,
    } = staticTrace;
    return dynamicType || staticType;
  },

  /** @param {DataProvider} dp */
  getFirstTraceOfContext(dp, contextId) {
    const traces = dp.indexes.traces.byContext.get(contextId);
    if (!traces?.length) {
      return null;
    }
    return traces[0];
  },

  /** @param {DataProvider} dp */
  getLastTraceOfContext(dp, contextId) {
    const traces = dp.indexes.traces.byContext.get(contextId);
    if (!traces?.length) {
      return null;
    }
    return traces[traces.length - 1];
  },

  /**
   * Returns the parentTrace of a context, not necessarily a BCE.
   * Use `getOwnCallerTraceOfContext` if you want the BCE of a context.
   * 
   * @param {DataProvider} dp 
   * @param {number} contextId 
   */
  getParentTraceOfContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    if (!context) {
      return null;
    }

    const parentTrace = dp.collections.traces.getById(context.parentTraceId);
    if (!parentTrace) {
      return null;
    }

    const parentContext = dp.util.getExecutionContext(parentTrace.contextId);

    if (parentContext?.tracesDisabled) {
      return null;
    }

    return parentTrace || null;
  },

  /** @param {DataProvider} dp */
  getFirstTraceOfRun(dp, runId) {
    const traces = dp.indexes.traces.byRun.get(runId);
    if (!traces?.length) {
      return null;
    }
    return traces[0];
  },

  /** @param {DataProvider} dp */
  getLastTraceOfRun(dp, runId) {
    const traces = dp.indexes.traces.byRun.get(runId);
    if (!traces?.length) {
      return null;
    }
    return traces[traces.length - 1];
  },

  /** @param {DataProvider} dp */
  isFirstTraceOfRun(dp, traceId) {
    const { runId } = dp.collections.traces.getById(traceId);
    const firstTraceId = dp.util.getFirstTraceOfRun(runId).traceId;
    return firstTraceId === traceId;
  },

  /** @param {DataProvider} dp */
  getAllErrorTraces(dp) {
    return dp.indexes.traces.error.get(1) || EmptyArray;
  },

  // ###########################################################################
  // DataNodes
  // ###########################################################################

  /**
   * @param {DataProvider} dp
   * @return {DataNode} DataNode of value trace
   */
  getDataNodeOfTrace(dp, traceId) {
    const valueTrace = dp.util.getValueTrace(traceId);
    return dp.collections.dataNodes.getById(valueTrace.nodeId);
  },

  /** @param {DataProvider} dp */
  getDataNodesOfTrace(dp, traceId) {
    return dp.indexes.dataNodes.byTrace.get(traceId);
  },

  // ###########################################################################
  // trace values
  // ###########################################################################

  /**
   * NOTE: We want to link multiple traces against the same trace sometimes.
   *  E.g.: we want to treat the value of a `BCE` the same as its `CRE`.
   * @param {DataProvider} dp 
  */
  getValueTrace(dp, traceId) {
    let trace = dp.collections.traces.getById(traceId);
    const traceType = dp.util.getTraceType(traceId);
    if (isBeforeCallExpression(traceType) && trace.resultId) {
      // trace is `BeforeCallExpression` and has a matching result trace
      return dp.collections.traces.getById(trace.resultId);
    }
    return trace;
  },

  /** @param {DataProvider} dp */
  isTraceTrackableValue(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.isDataNodeTrackableValue(dataNode.nodeId) : false;
  },

  /** @param {DataProvider} dp */
  isTracePlainObjectOrArrayValue(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.isDataNodePlainObjectOrArrayValue(dataNode.nodeId) : false;
  },

  /** @param {DataProvider} dp */
  isTracePlainObject(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.isDataNodePlainObject(dataNode.nodeId) : false;
  },

  /** @param {DataProvider} dp */
  isTraceFunctionValue(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.isDataNodeFunctionValue(dataNode.nodeId) : false;
  },

  /** @param {DataProvider} dp */
  isDataNodeTrackableValue(dp, nodeId) {
    const valueRef = dp.util.getDataNodeValueRef(nodeId);
    return valueRef && isObjectCategory(valueRef.category) || false;
  },

  /** @param {DataProvider} dp */
  isDataNodePlainObjectOrArrayValue(dp, nodeId) {
    const valueRef = dp.util.getDataNodeValueRef(nodeId);
    return valueRef && isPlainObjectOrArrayCategory(valueRef.category) || false;
  },

  /** @param {DataProvider} dp */
  isDataNodePlainObject(dp, nodeId) {
    const valueRef = dp.util.getDataNodeValueRef(nodeId);
    return valueRef && isPlainObjectOrArrayCategory(valueRef.category) || false;
  },

  /** @param {DataProvider} dp */
  isDataNodeFunctionValue(dp, nodeId) {
    const valueRef = dp.util.getDataNodeValueRef(nodeId);
    return valueRef && isFunctionCategory(valueRef.category) || false;
  },

  /**
   * @param {DataProvider} dp
   */
  doesTraceHaveValue(dp, traceId) {
    return !!dp.util.getDataNodeOfTrace(traceId);
  },

  /** 
   * NOTE: Call `isTracePlainObjectOrArrayValue` to make sure it is reconstructable
   * @param {DataProvider} dp
   */
  constructValueObjectFull(dp, nodeId) {
    // TODO
  },

  /**
   * NOTE: Call `isTracePlainObjectOrArrayValue` to make sure it is reconstructable
   * 
   * @param {DataProvider} dp
   * @return {{prop: number}} returns the `prop`, `nodeId` key-value pairs
   */
  constructValueObjectShallow(dp, refId, terminateNodeId) {
    const valueRef = dp.collections.values.getById(refId);

    // initial values
    const entries = { ...valueRef.value };

    if (!entries) {
      // sanity check
      dp.logger.error(`Cannot construct non-object valueRef: ${JSON.stringify(valueRef)}`);
    }

    // + writes - delete
    const modifyNodes = dp.indexes.dataNodes.byObjectRefId.get(refId)?.filter(node => isDataNodeModifyType(node.type)) || EmptyArray;
    for (const modifyNode of modifyNodes) {
      if (modifyNode.nodeId > terminateNodeId) {
        // only apply write operations `before` the terminateNodeId
        break;
      }
      if (modifyNode.type === DataNodeType.Write) {
        const { prop } = modifyNode.varAccess;
        if (modifyNode.refId) {
          entries[prop] = [modifyNode.nodeId, modifyNode.refId, null];
        }
        else {
          entries[prop] = [modifyNode.nodeId, null, modifyNode.value];
        }
      }
      else if (modifyNode.type === DataNodeType.Delete) {
        const { prop } = modifyNode.varAccess;
        delete entries[prop];
      }
    }

    return entries;
  },

  /**
   * WARNING: Call `doesTraceHaveValue` to make sure, the trace has a value.
   * 
   * @param {DataProvider} dp
   * @return Value of given trace. If value is `undefined`, it could mean that the `value` is actually `undefined`, or, in case of traces that are not expressions, that there is no value.
   */
  getTraceValuePrimitive(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dp.util.getDataNodeValuePrimitive(dataNode.nodeId);
  },

  /** @param {DataProvider} dp */
  getDataNodeValuePrimitive(dp, nodeId) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (!dataNode) {
      return undefined;
    }

    if (dataNode.value !== undefined) {
      return dataNode.value;
    }

    if (dataNode.refId) {
      const valueRef = dp.collections.values.getById(dataNode.refId);
      if (!valueRef) {
        logError(`valueRef does not exist for dataNode - ${JSON.stringify(dataNode)}`);
        return undefined;
      }
      // TODO: this is not the correct value for objects or arrays, needs reconstruct
      // TODO: some shallow reconstruct?
      return valueRef.value;
    }

    return undefined;
  },

  /**
   * Handle special circumstances.
   */
  getTraceValueMessage(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    if (valueRef?.pruneState === ValuePruneState.Omitted) {
      return `(omitted value)`;
    }
    return null;
  },

  /** 
   * WARNING: Call `doesTraceHaveValue` to make sure, the trace has a value.
   * 
   * @param {DataProvider} dp
   */
  getTraceValueString(dp, traceId) {
    const trace = dp.util.getValueTrace(traceId);

    if (trace._valueString) {
      // already cached
      return trace._valueString;
    }

    // TODO: separate "message" from valueString
    // A message is generated if there is an issue with the value or it was omitted.
    const valueMessage = dp.util.getTraceValueMessage(traceId);
    if (valueMessage) {
      return valueMessage;
    }

    // get value
    const value = dp.util.getTraceValuePrimitive(traceId);

    let valueString;
    if (dp.util.isTraceFunctionValue(traceId)) {
      valueString = value;
    }
    else if (value === undefined) {
      valueString = 'undefined';
    }
    else {
      // TODO: fix this
      // valueString = JSON.stringify(value);
      valueString = value?.toString?.() || String(value);
    }

    // hackfix: we cache this thing
    return trace._valueString = valueString;
  },

  /** @param {DataProvider} dp */
  getTraceValueStringShort(dp, traceId) {
    const trace = dp.util.getValueTrace(traceId);

    if (trace._valueStringShort) {
      // already cached
      return trace._valueStringShort;
    }

    // get value
    let valueString = dp.util.getTraceValueString(traceId);
    const ShortLength = 30;
    if (valueString && valueString.length > (ShortLength - 3)) {
      if (dp.util.isTracePlainObject(traceId)) {
        // object -> just use category
        const valueRef = dp.util.getTraceValueRef(traceId);
        valueString = ValueTypeCategory.nameFrom(valueRef.category);
      }
      else {
        // TODO: do this recursively, so array-of-object does not display object itself
        valueString = valueString.substring(0, ShortLength - 3) + '...';
      }
    }

    // hackfix: we cache this thing
    return trace._valueStringShort = valueString;
  },

  /** @param {DataProvider} dp */
  getTraceValueRef(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.getDataNodeValueRef(dataNode.nodeId) : null;
  },

  /** @param {DataProvider} dp */
  getDataNodeValueRef(dp, nodeId) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (dataNode) {
      const { refId } = dataNode;
      if (refId) {
        return dp.collections.values.getById(refId);
      }
    }
    return null;
  },

  getTraceRefId(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    return valueRef?.refId;
  },

  /** @param {DataProvider} dp */
  getAllTracesOfObjectOfTrace(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    if (valueRef?.refId) {
      return dp.indexes.traces.byRefId.get(valueRef.refId);
    }
    return null;
  },

  getDataNodesByRefId(dp, refId) {
    return dp.indexes.dataNodes.byRefId.get(refId);
  },

  getFirstTraceIdByRefId(dp, refId) {
    const dataNode = dp.indexes.dataNodes.byRefId.getFirst(refId);
    return dataNode?.traceId;
  },

  getFirstTraceByRefId(dp, refId) {
    const traceId = dp.util.getFirstTraceIdByRefId(refId);
    return traceId && dp.util.getTrace(traceId);
  },

  // ###########################################################################
  // call related trace
  // ###########################################################################


  /** @param {DataProvider} dp */
  isTraceArgument(dp, traceId) {
    // a trace is an argument if it has callId not pointing to itself
    const trace = dp.collections.traces.getById(traceId);
    if (trace.callId) {
      if (trace.callId !== trace.traceId) {
        return true;
      }
    }
    return false;
  },

  isCallBCEOrResultTrace(dp, traceId) {
    return dp.util.isCallResultTrace(traceId) || dp.util.isBCETrace(traceId);
  },

  isBCETrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    return trace.callId && trace.callId === traceId;
  },

  isCallResultTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    return trace.resultCallId;
  },

  /**
   * Get callerTrace (BCE) of a call related trace, returns itself if it is not a call related trace.
   * Note: if a trace is both `CallArgument` and `CallExpressionResult`, returns the argument trace.
   * Note: we use this to find the parent trace of a given context.
   * @param {DataProvider} dp
   * @param {number} traceId
  */
  getPreviousCallerTraceOfTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    // TODO: deal with callback traces after context.schedulerTraceId is back
    // const context = dp.collections.executionContexts.getById(trace.contextId);
    // if (context.schedulerTraceId) {
    //   // trace is push/pop callback
    //   return dp.util.getCallerTraceOfTrace(context.schedulerTraceId);
    // }
    if (hasCallId(trace)) {
      // trace is call/callback argument or BCE
      return dp.collections.traces.getById(trace.callId);
    }
    else {
      // not a call related trace
      return trace;
      // return null;
    }
  },

  /**
   * Get callerTrace (BCE) of a call related trace, returns itself if it is not a call related trace.
   * Note: if a trace is both `CallArgument` and `CallExpressionResult`, returns the result trace.
   * @param {DataProvider} dp
   * @param {number} traceId
  */
  getCallerTraceOfTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    // TODO: deal with callback traces after context.schedulerTraceId is back
    // const context = dp.collections.executionContexts.getById(trace.contextId);
    // if (context.schedulerTraceId) {
    //   // trace is push/pop callback
    //   return dp.util.getCallerTraceOfTrace(context.schedulerTraceId);
    // }
    if (isCallResult(trace)) {
      // trace is call expression result
      return dp.collections.traces.getById(trace.resultCallId);
    }
    else if (hasCallId(trace)) {
      // trace is call/callback argument or BCE
      return dp.collections.traces.getById(trace.callId);
    }
    else {
      // not a call related trace
      return trace;
      // return null;
    }
  },

  /**
   * Returns the BCE of a context, if it has one. Else it returns the last trace before the context.
   * NOTE: `parentTrace` of a context might not participate in a call, e.g. in case of getters or setters
   * NOTE: To get the actual caller of the context, see `util.getOwnCallerTraceOfContext`
   * @param {DataProvider} dp 
   * @param {number} contextId
  */
  getCallerTraceOfContext(dp, contextId) {
    const parentTrace = dp.util.getParentTraceOfContext(contextId);
    // if (parentTrace) {
    //   // try to get BCE of call
    //   const callerTrace = dp.util.getPreviousCallerTraceOfTrace(parentTrace.traceId);
    //   return callerTrace;
    // }
    return parentTrace;
  },

  /** 
   * Given some trace with a `callId`: find its `BCE` -> then get the `BCE`'s staticTrace.
   * 
   * @param {DataProvider} dp
   */
  getRelatedBCEStaticTrace(dp, traceId) {
    const argTrace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = argTrace;
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { callId: callStaticId } = staticTrace;

    return callStaticId && dp.collections.staticTraces.getById(callStaticId) || null;
  },

  /**
   * Return the result trace in the call if exist
   * @param {DataProvider} dp 
  */
  getCallResultTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const traceType = dp.util.getTraceType(traceId);
    if (trace.schedulerTraceId) {
      // trace is push/pop callback
      return dp.util.getCallResultTrace(trace.schedulerTraceId);
    }
    else if (isBeforeCallExpression(traceType)) {
      if (trace.resultId) {
        // trace is a BeforeCallExpression and has result
        return dp.collections.traces.getById(trace.resultId);
      }
      return null;
    }
    // else if (isCallArgumentTrace(trace)) {
    else if (hasCallId(trace)) {
      // call argument
      return dp.util.getCallResultTrace(trace.callId);
    }
    else if (isCallResult(trace)) {
      // trace itself is a resultTrace
      return trace;
    }

    // Not a call related trace or the call does not have a result
    return null;
  },

  /**
   * @param {DataProvider} dp 
  */
  getStaticCallId(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    return staticTrace.resultCallId || staticTrace.callId;
  },

  /**
   * @param {DataProvider} dp
  */
  getCallArgTraces(dp, callId) {
    const bceTrace = dp.collections.traces.getById(callId);
    return bceTrace.data?.argTids.map(tid => dp.collections.traces.getById(tid));
  },

  /**
   * NOTE: This works automatically for spread operator.
   * 
   * @return Flattened version of DataNodes of `CallExpression` arguments.
   */
  getCallArgDataNodes(dp, callId) {
    const argTraces = dp.util.getCallArgTraces(callId);
    const { argConfigs } = dp.util.getStaticTrace(callId).data;
    return argTraces.flatMap((t, i) => {
      const dataNodes = dp.util.getDataNodesOfTrace(t.traceId);
      if (!argConfigs[i]?.isSpread) {
        // not spread -> take the argument's own `DataNode`
        return dataNodes[0];
      }
      // spread -> take all of the spread argument's additional `DataNode`s (which are the argument DataNodes)
      return dataNodes.slice(1);
    });
  },

  /**
   * Returns array of values of args, but only for primitive values.
   * Non-primitive argument values will be `undefined`.
   */
  getCallArgPrimitiveValues(dp, callId) {
    const dataNodes = dp.util.getCallArgDataNodes(callId);
    return dataNodes?.map(node => node.value);
  },


  getReturnValueRefOfContext(dp, contextId) {
    const bceTrace = dp.util.getOwnCallerTraceOfContext(contextId);
    return bceTrace && dp.util.getTraceValueRef(bceTrace.traceId) || null;
  },

  /**
   * @param {DataProvider} dp
  */
  getCalleeTraceId(dp, callId) {
    return dp.collections.traces.getById(callId)?.data?.calleeTid;
  },

  // getTracesOfCalledContext(dp, callId) {
  //   return dp.indexes.traces.byCalleeTrace.get(callId) || EmptyArray;
  // },

  /**
   * Given a `callId` (traceId of a CallExpression), returns whether its callee was recorded (i.e. instrumented/traced).
   * NOTE: Some calls have an underlying context, but that is not the context of the function was called.
   *    -> e.g. `array.map(f)` might have recorded f's context, but `f` is not `array.map` (the actual callee).
   */
  isCalleeTraced(dp, callId) {
    const context = dp.indexes.executionContexts.byCalleeTrace.getUnique(callId);
    return context && !!dp.util.getOwnCallerTraceOfContext(context.contextId);
  },

  /**
   * like `util.getCallerTraceOfContext` but returns null if its context's `definitionTid` does not match the callee.
   * @param {DataProvider} dp 
   * @param {number} contextId
   */
  getOwnCallerTraceOfContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const bceTrace = dp.util.getCallerTraceOfContext(contextId);
    if (!bceTrace?.data) {
      return null;
    }

    // check if it is the actual bce
    const calleeTrace = dp.collections.traces.getById(bceTrace.data.calleeTid);
    if (!calleeTrace) {
      return null;
    }

    const calleeDataNode = dp.collections.dataNodes.getById(calleeTrace.nodeId);
    const functionRef = dp.collections.values.getById(calleeDataNode.refId);
    if (!functionRef) {
      return null;
    }

    const { traceId } = dp.collections.dataNodes.getById(functionRef.nodeId);
    if (context.definitionTid === traceId) {
      // Accept: definitionTid are matched
      return bceTrace;
    }
    else {
      // Reject
      return null;
    }
  },

  /**
   * Map of `calleeRefId` -> `BCEs` of functions whose execution was not recorded/traced (e.g. native functions).
   * @param {DataProvider} dp
   */
  getAllUntracedFunctionCallsByRefId(dp) {
    const untracedBces = dp.collections.staticTraces.all
      .filter(staticTrace => staticTrace && TraceType.is.BeforeCallExpression(staticTrace.type))
      .flatMap(staticTrace => dp.indexes.traces.byStaticTrace.get(staticTrace.staticTraceId) || EmptyArray)
      .filter(trace => !dp.util.isCalleeTraced(trace.traceId));

    // NOTE: the same untraced function might have been called in different places
    //    -> make unique set by callee refId
    const byRefId = groupBy(untracedBces, trace => {
      const calleeTraceId = dp.util.getCalleeTraceId(trace.traceId);
      return calleeTraceId && dp.util.getTraceRefId(calleeTraceId) || 0;
    });
    delete byRefId[0];  // remove those whose `refId` could not be recovered (e.g. due to disabled tracing)
    return byRefId;
  },

  // ###########################################################################
  // contexts
  // ###########################################################################

  /** @param {DataProvider} dp */
  getTraceContext(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    return dp.collections.executionContexts.getById(contextId);
  },

  /** @param {DataProvider} dp */
  isTraceInRealContext(dp, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    const { contextType } = dp.collections.executionContexts.getById(contextId);

    return isRealContextType(contextType);
  },

  /** @param {DataProvider} dp */
  getRealContextId(dp, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    const context = dp.collections.executionContexts.getById(contextId);
    const { parentContextId } = context;
    const parentContext = dp.collections.executionContexts.getById(parentContextId);

    if (isRealContextType(context.contextType)) {
      return contextId;
    }
    else if (parentContext && isRealContextType(parentContext.contextType)) {
      return parentContextId;
    }
    else {
      logError('Could not find realContext.');
      return null;
    }
  },

  /** @param {DataProvider} dp */
  getTracesOfRealContext(dp, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    if (dp.util.isTraceInRealContext(traceId)) {
      return dp.indexes.traces.byContext.get(contextId);
    }
    else {
      const context = dp.collections.executionContexts.getById(contextId);
      const { parentContextId } = context;
      return dp.indexes.traces.byParentContext.get(parentContextId);
    }
  },

  /** @param {DataProvider} dp */
  getTraceStaticContextId(dp, traceId) {
    const context = dp.util.getTraceContext(traceId);
    const { staticContextId } = context;
    return staticContextId;
  },

  getContextStaticContextId(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const { staticContextId } = context;
    return staticContextId;
  },

  getContextStaticContext(dp, contextId) {
    const staticContextId = dp.util.getContextStaticContextId(contextId);
    return dp.collections.staticContexts.getById(staticContextId);
  },

  /** @param {DataProvider} dp */
  getTraceStaticContext(dp, traceId) {
    const staticContextId = dp.util.getTraceStaticContextId(traceId);
    return dp.collections.staticContexts.getById(staticContextId);
  },

  /** @param {DataProvider} dp */
  getFirstContextOfRun(dp, runId) {
    const contexts = dp.indexes.executionContexts.byRun.get(runId);
    if (!contexts?.length) {
      return null;
    }
    return contexts[0];
  },

  /** @param {DataProvider} dp */
  isFirstContextOfRun(dp, contextId) {
    const { runId } = dp.collections.executionContexts.getById(contextId);
    const firstContextId = dp.util.getFirstContextOfRun(runId)?.contextId;
    return firstContextId === contextId;
  },

  isFirstContextInParent(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const { parentContextId } = context;
    if (parentContextId) {
      return dp.indexes.executionContexts.children.getFirst(parentContextId) === context;
    }
    return false;
  },

  // ###########################################################################
  // misc
  // ###########################################################################

  /** @param {DataProvider} dp */
  getTraceContextType(dp, traceId) {
    const staticContext = dp.util.getTraceStaticContext(traceId);
    return staticContext.type;
  },

  getTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    return trace;
  },

  getExecutionContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    return context;
  },

  getStaticTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = trace;
    return dp.collections.staticTraces.getById(staticTraceId);
  },

  /** @param {DataProvider} dp */
  getStaticTraceProgramId(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    if (!staticTrace) {
      return null;
    }
    const {
      staticContextId
    } = staticTrace;

    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const { programId } = staticContext;
    return programId;
  },

  getStaticTraceDisplayName(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    return staticTrace.displayName;
  },

  getTraceProgramPath(dp, traceId) {
    const programId = dp.util.getTraceProgramId(traceId);
    return dp.util.getFilePathFromProgramId(programId);
  },

  /** @param {DataProvider} dp */
  getTraceProgramId(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);

    const {
      staticTraceId,
    } = trace || EmptyObject;

    return dp.util.getStaticTraceProgramId(staticTraceId);
  },

  /** @param {DataProvider} dp */
  getTraceFilePath(dp, traceId) {
    const programId = dp.util.getTraceProgramId(traceId);
    return programId && dp.util.getFilePathFromProgramId(programId) || null;
  },

  /** @param {DataProvider} dp */
  getTraceFileName(dp, traceId) {
    const programId = dp.util.getTraceProgramId(traceId);
    return programId && dp.collections.staticProgramContexts.getById(programId).fileName || null;
  },

  // ###########################################################################
  // SpecialIdentifierType
  // ###########################################################################

  getTracesOfSpecialIdentifierType(dp, specialType, startId = 1) {
    return dp.indexes.traces.bySpecialIdentifierType.get(specialType) || EmptyArray;
  },

  getAllRequireTraces(dp, startId = 1) {
    return dp.util.getTracesOfSpecialIdentifierType(SpecialIdentifierType.Require, startId);
  },

  getAllRequirePaths(dp, startId = 1) {
    // NOTE: these should be BCE traces, meaning traceId === callId
    const traces = dp.util.getAllRequireTraces(startId);

    // get all first arguments of `require`
    // TODO: currently first arguments are not traced in case of constant expression -> store in `staticTrace` instead!
    return traces.map(t => dp.util.getCallArgPrimitiveValues(t.traceId)?.[0]).filter(t => !!t);
  },

  getAllRequireModuleNames(dp, startId = 1) {
    const set = new Set(
      dp.util.getAllRequirePaths(startId)
        .map(p => p.split('/', 1)[0])
    );
    set.delete('.');
    set.delete('..');
    return Array.from(set);
  },

  // ###########################################################################
  // trace grouping
  // ###########################################################################

  /**
   * @param {DataProvider} dp 
  */
  getAllTracesOfStaticContext(dp, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    if (!staticContext) {
      return null;
    }

    const {
      type: staticContextType
    } = staticContext;

    let traces;
    if (isVirtualContextType(staticContextType)) {
      // Get all traces of the actual function, not it's virtual children (such as `Await`, `Resume` et al)
      // NOTE: `Await` and `Yield` contexts do not contain traces, only `Resume` contexts contain traces for interruptable functions
      traces = dp.util.getTracesOfParentStaticContext(staticContextId);
    }
    else {
      // find all traces belonging to that staticContext
      traces = dp.indexes.traces.byStaticContext.get(staticContextId) || EmptyArray;
    }
    return traces;
  },

  /**
   * @param {DataProvider} dp 
  */
  getTracesOfParentStaticContext(dp, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const parentStaticContextId = staticContext.parentId;
    // const parentStaticContext = dp.collections.staticContexts.getById(parentStaticContextId);
    return dp.indexes.traces.byParentStaticContext.get(parentStaticContextId) || EmptyArray;
  },

  /**
   * Groups traces by TraceType, as well as staticTraceId.
   * 
   * TODO: improve performance, use MultiKeyIndex instead
   * @param {DataProvider} dp 
   * @param {StaticTrace[]} staticTraces
  */
  groupTracesByType(dp, staticTraces) {
    const groups = [];
    for (const staticTrace of staticTraces) {
      const {
        type: staticType,
        staticTraceId
      } = staticTrace;

      const traces = dp.indexes.traces.byStaticTrace.get(staticTraceId);
      if (!traces) {
        continue;
      }

      if (!hasDynamicTypes(staticType)) {
        // one group of traces
        pushArrayOfArray(groups, staticType, [staticTrace, traces]);
      }
      else {
        // multiple groups of traces for this `staticTrace`
        const traceGroups = [];
        for (const trace of traces) {
          const { type: dynamicType } = trace;
          pushArrayOfArray(traceGroups, dynamicType || staticType, trace);
        }

        for (let type = 0; type < traceGroups.length; ++type) {
          const tracesOfGroup = traceGroups[type];
          if (tracesOfGroup) {
            pushArrayOfArray(groups, type, [staticTrace, tracesOfGroup]);
          }
        }
      }
    }
    return groups;
  },

  // ###########################################################################
  // trace info + debugging
  // ###########################################################################

  makeStaticTraceInfo(dp, traceId) {
    const fpath = dp.util.getTraceProgramPath(traceId);
    const st = dp.util.getStaticTrace(traceId);
    const loc = locToString(st.loc);
    const where = `${fpath}:${loc}`;
    return `"${st?.displayName}" at ${where} (stid=${st?.staticTraceId})`;
  },

  /**
   * 
   */
  makeTraceInfo(dp, traceId) {
    // const { traceId } = trace;
    // const trace = dp.collections.traces.getById(traceId);
    const traceType = dp.util.getTraceType(traceId);
    const typeName = TraceType.nameFrom(traceType);
    return `[${typeName}] #${traceId} ${dp.util.makeStaticTraceInfo(traceId)}`;
  },

  // ###########################################################################
  // Contexts + their traces
  // ###########################################################################

  /**
   * Whether this is the last trace we have seen in its context.
   * NOTE: Ignores final `PopImmediate`.
   * @param {DataProvider} dp 
  */
  isLastTraceInRealContext(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    return dp.util.getLastTraceInRealContext(contextId) === trace;
  },

  /**
   * Whether this is the last trace of its static context
   * NOTE: Ignores final `PopImmediate`.
   * @param {DataProvider} dp 
  */
  isLastStaticTraceInContext(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = staticTrace;
    return dp.util.getLastStaticTraceInContext(staticContextId) === staticTrace;
  },

  /** @param {DataProvider} dp */
  getActualLastTraceInRealContext(dp, contextId) {
    const traces = dp.indexes.traces.byRealContext.get(contextId);
    return traces?.[traces.length - 1] || null;
  },

  /**
   * Whether this is the last trace we have seen in its context.
   * NOTE: Ignores final `PopImmediate`.
   * @param {DataProvider} dp 
  */
  getLastTraceInRealContext(dp, contextId) {
    const traces = dp.indexes.traces.byRealContext.get(contextId);
    let last = traces?.[traces.length - 1] || null;
    if (last) {
      // ignore pop
      const { traceId: lastId } = last;
      const traceType = dp.util.getTraceType(lastId);
      if (isTracePop(traceType)) {
        last = traces[traces.length - 2] || null;
      }
    }
    return last;
  },

  /**
   * Whether this is the last trace of its static context.
   * NOTE: Ignores final `PopImmediate`.
   * @param {DataProvider} dp 
  */
  getLastStaticTraceInContext(dp, staticContextId) {
    const staticTraces = dp.indexes.staticTraces.byContext.get(staticContextId);
    let last = staticTraces?.[staticTraces.length - 1] || null;
    if (isTracePop(last?.type)) {
      // ignore pop
      last = staticTraces[staticTraces.length - 2] || null;
    }
    return last;
  },

  getTracesOfContextAndType(dp, contextId, type) {
    const traces = dp.indexes.traces.byContext.get(contextId);
    // NOTE: `Await` contexts don't have traces
    // if (!traces) {
    //   dp.logger.error(`Context did not have any traces: ${contextId}`);
    // }
    return traces?.filter(trace => dp.util.getTraceType(trace.traceId) === type) || EmptyArray;
  },

  /** @param {DataProvider} dp */
  hasRealContextPopped(dp, contextId) {
    const lastTrace = dp.util.getActualLastTraceInRealContext(contextId);
    return lastTrace && isTracePop(dp.util.getTraceType(lastTrace.traceId)) || false;
  },

  // ###########################################################################
  // Error handling
  // ###########################################################################

  // isErrorTrace(dp, traceId) {
  //   // ` && `getLastTraceInRealContext.staticTrace` !== ``getLastStaticTraceInRealContext

  //   const trace = dp.collections.traces.getById(traceId);
  //   const { staticTraceId } = trace;
  //   const traceType = dp.util.getTraceType(traceId);

  //   console.log('errorTrace', !isReturnTrace(traceType),

  //     traceId, staticTraceId,
  //     dp.util.getRealContextId(traceId),

  //     dp.util.getLastTraceInRealContext(dp.util.getRealContextId(traceId))?.traceId,
  //     dp.util.getLastStaticTraceInContext(dp.collections.staticTraces.getById(staticTraceId).staticContextId)?.staticTraceId,

  //     // is last trace we have recorded in context
  //     dp.util.isLastTraceInRealContext(traceId),

  //     // but is not last trace in the code
  //     !dp.util.isLastStaticTraceInContext(staticTraceId),

  //     // the context must have popped (finished), or else there was no error (yet)
  //     dp.util.hasRealContextPopped(dp.util.getRealContextId(traceId)));

  //   // is not a return trace (because return traces indicate function succeeded)
  //   return !isReturnTrace(traceType) &&

  //     // is last trace we have recorded in context
  //     dp.util.isLastTraceInRealContext(traceId) &&

  //     // but is not last trace in the code
  //     !dp.util.isLastStaticTraceInContext(staticTraceId) &&

  //     // the context must have popped (finished), or else there was no error (yet)
  //     dp.util.hasRealContextPopped(dp.util.getRealContextId(traceId));
  // },

  // hasContextError(dp, realContextId) {
  //   const trace = dp.util.getLastTraceInRealContext(realContextId);
  //   return dp.util.isErrorTrace(trace);
  // },

  // ###########################################################################
  // loc (locations)
  // ###########################################################################

  getTraceLoc(dp, traceId) {
    const { loc } = dp.util.getStaticTrace(traceId);
    return loc;
  },

  // ###########################################################################
  // code chunks
  // ###########################################################################

  getCodeChunkId(dp, traceId) {
    const { codeChunkId } = dp.util.getTrace(traceId);
    return codeChunkId;
  },

  // ###########################################################################
  // dynamic tracing meta
  // ###########################################################################

  /**
   * Whether or not traces for this context were enabled.
   */
  isContextTraced(dp, contextId) {
    const { tracesDisabled } = dp.util.getExecutionContext(contextId);
    return !tracesDisabled;
  },

  // ###########################################################################
  // graph traversal
  // ###########################################################################

  traverseDfs(dp, contexts, dfsRecurse, preOrderCb, postOrderCb) {
    const runIds = new Set(contexts.map(c => c.runId));

    dfsRecurse = dfsRecurse || ((dfs, context, children, prev) => {
      for (const child of children) {
        dfs(child, prev);
      }
    });

    const dfs = ((context) => {
      const children = dp.util.getChildrenOfContext(context.contextId);

      let subtreeResult;
      if (preOrderCb) {
        subtreeResult = preOrderCb(context, children, subtreeResult);
      }

      subtreeResult = dfsRecurse(dfs, context, children, subtreeResult);

      if (postOrderCb) {
        subtreeResult = postOrderCb(context, children, subtreeResult);
      }
      return subtreeResult;
    });

    // find all roots
    // let lastResult = null;
    for (const runId of runIds) {
      for (const root of dp.indexes.executionContexts.byRun.get(runId)) {
        dfs(root);
      }
    }
  },

  getChildrenOfContext(dp, contextId) {
    return dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
  },

  // ###########################################################################
  // labels
  // ###########################################################################

  makeTypeNameLabel(dp, traceId) {
    const traceType = dp.util.getTraceType(traceId);
    const typeName = TraceType.nameFrom(traceType);
    return `[${typeName}]`;
  },

  // ###########################################################################
  // async
  // ###########################################################################

  /** @param {DataProvider} dp */
  getAsyncRootThreadId(dp, rootId) {
    return dp.indexes.asyncNodes.byRoot.getUnique(rootId)?.threadId;
  },

  /** @param {DataProvider} dp */
  getChainFrom(dp, fromRootId) {
    const fromEdges = dp.indexes.asyncEvents.from.get(fromRootId);
    return fromEdges?.find(edge => edge.edgeType === AsyncEdgeType.Chain) || null;
  },

  /** @param {DataProvider} dp */
  getAsyncEdgeFromTo(dp, fromRootId, toRootId) {
    const toEdges = dp.indexes.asyncEvents.to.get(toRootId);
    return toEdges?.find(edge => edge.fromRootContextId === fromRootId) || null;
  },

  /** @param {DataProvider} dp */
  getAsyncPreEventUpdateOfTrace(dp, schedulerTraceId) {
    return dp.indexes.asyncEventUpdates.byTrace.get(schedulerTraceId)?.[0];
  },

  /** @param {DataProvider} dp */
  getFirstAsyncPostEventUpdateOfTrace(dp, schedulerTraceId) {
    return dp.indexes.asyncEventUpdates.byTrace.get(schedulerTraceId)?.[1];
  },

  /** 
   * Get the last "Post" asyncEvent of given `schedulerTraceId`.
   * That update must have `rootId` < `beforeRootId`.
   * 
   * @param {DataProvider} dp
   */
  getPreviousAsyncPostEventUpdateOfTrace(dp, schedulerTraceId, beforeRootId) {
    const updates = dp.indexes.asyncEventUpdates.byTrace.get(schedulerTraceId);
    return updates && findLast(updates, update => update.rootId < beforeRootId);
  },

  /**
   * Get the last "Post" asyncEvent (also an "edge trigger event") of a given promise.
   * That update must have `rootId` < `beforeRootId`.
   *
   * @param {DataProvider} dp
   * @return {AsyncEventUpdate}
   */
  getPreviousPostOrResolveAsyncEventOfPromise(dp, promiseId, beforeRootId) {
    // NOTE: the index only references `POST` + `Resolve` updates
    const updates = dp.indexes.asyncEventUpdates.byPromise.get(promiseId);
    let postUpdate = updates && findLast(updates, update => update.rootId < beforeRootId);
    if (postUpdate && AsyncEventUpdateType.is.PostThen(postUpdate.type) && postUpdate.nestedPromiseId) {
      // recurse on nested promises
      postUpdate = dp.util.getPreviousPostOrResolveAsyncEventOfPromise(postUpdate.nestedPromiseId, beforeRootId);
    }

    return postUpdate;
  },


  /** @param {DataProvider} dp */
  getFirstPostOrResolveAsyncEventOfPromise(dp, promiseId) {
    return dp.indexes.asyncEventUpdates.byPromise.getFirst(promiseId);
  },


  /** @param {DataProvider} dp */
  isNestedChain(dp, nestedPromiseId, schedulerTraceId) {
    const nestingPromiseRunId = nestedPromiseId && dp.util.getFirstTraceByRefId(nestedPromiseId)?.runId;
    const firstNestingAsyncUpdate = nestingPromiseRunId && dp.util.getFirstNestingAsyncUpdate(nestingPromiseRunId, nestedPromiseId);
    const firstNestingTraceId = firstNestingAsyncUpdate?.schedulerTraceId;
    return firstNestingTraceId && firstNestingTraceId === schedulerTraceId || false;
  },

  /** @param {DataProvider} dp */
  getNestingAsyncUpdates(dp, runId, promiseId) {
    const eventKey = [runId, promiseId];
    return dp.indexes.asyncEventUpdates.byNestedPromiseAndRun.get(eventKey);
  },

  /** @param {DataProvider} dp */
  getFirstNestingAsyncUpdate(dp, runId, promiseId) {
    return dp.util.getNestingAsyncUpdates(runId, promiseId)?.[0] || null;
  },

  /**
   * Only checks for *first* nesting update of given `runId`.
   *  -> Because: all following updates are SYNC, not CHAIN.
   * 
   * @param {DataProvider} dp
   */
  isPromiseChainedToRoot(dp, runId, promiseId) {
    // TODO: won't work when chaining promises that don't have their own Post* AsyncEvent (e.g. `Promise.resolve().then`)

    const firstNestingAsyncUpdate = dp.util.getFirstNestingAsyncUpdate(runId, promiseId);
    if (!firstNestingAsyncUpdate) {
      return false;
    }

    const { contextId, rootId, promiseId: returnPromiseId } = firstNestingAsyncUpdate;

    if (contextId === rootId) {
      // root
      return true;
    }

    if (returnPromiseId) {
      // contextId !== rootId -> (most likely?) a first await
      return dp.util.isPromiseChainedToRoot(runId, returnPromiseId);
    }

    return false;

    // const parentContextId = getPromiseOwnAsyncFunctionContextId(asyncFunctionPromise);


    // const chainedToRoot = getPromiseOwnChainedToRoot(promise);
    // if (chainedToRoot !== undefined) {
    //   return chainedToRoot;
    // }

    // const callerPromise = this.getAsyncCallerPromise(promise);
    // if (callerPromise) {
    //   return this.getAsyncCallerPromiseChainedToRoot(callerPromise);
    // }

    // return false;
  },

  /** @param {DataProvider} dp */
  getPostAwaitData(dp, postEventUpdate) {
    const { util } = dp;
    const {
      // runId: postEventRunId,
      // realContextId,
      rootId: postEventRootId,
      schedulerTraceId,
      promiseId
    } = postEventUpdate;

    const preEventUpdate = util.getAsyncPreEventUpdateOfTrace(schedulerTraceId);

    if (!preEventUpdate) {
      // should never happen!
      this.logger.warn(`[postAwait] "getAsyncPreEventUpdateOfTrace" failed:`, postEventUpdate);
      return null;
    }

    const {
      contextId: preEventContextId,
      runId: preEventRunId,
      nestedPromiseId
    } = preEventUpdate;

    const isFirstAwait = util.isFirstContextInParent(preEventContextId);
    // const previousPostUpdate = dp.util.getPreviousPostAsyncEventOfPromise(promiseId, preEventRootId);
    // const realContext = dp.collections.executionContexts.getById(realContextId);
    // const firstNestingUpdate = this.getFirstNestingAsyncUpdate(realContext.runId, promiseId);

    const isNested = !!nestedPromiseId;
    const isNestedChain = util.isNestedChain(nestedPromiseId, schedulerTraceId);
    const nestedUpdate = nestedPromiseId && util.getPreviousPostOrResolveAsyncEventOfPromise(nestedPromiseId, postEventRootId) || null;
    const { rootId: nestedRootId = 0 } = nestedUpdate ?? EmptyObject;
    const isChainedToRoot = dp.util.isPromiseChainedToRoot(preEventRunId, promiseId);

    return {
      preEventUpdate,
      isFirstAwait,
      isNested,
      isNestedChain,
      nestedUpdate,
      nestedRootId,
      isChainedToRoot
    };
  },

  /** @param {DataProvider} dp */
  getPostThenData(dp, postEventUpdate) {
    const { util } = dp;
    const {
      // runId: postEventRunId,
      rootId: postEventRootId,
      // NOTE: the last active root is also the `context` of the `then` callback
      // contextId,
      schedulerTraceId,
      promiseId: postPromiseId,
      nestedPromiseId
    } = postEventUpdate;

    const preEventUpdate = util.getAsyncPreEventUpdateOfTrace(schedulerTraceId);

    if (!preEventUpdate) {
      // should never happen!
      this.logger.warn(`[postAwait] "getAsyncPreEventUpdateOfTrace" failed:`, postEventUpdate);
      return null;
    }

    const {
      runId: preEventRunId,
      // rootId: preEventRootId,
      promiseId: prePromiseId,
    } = preEventUpdate;

    const previousPostUpdate = util.getPreviousPostOrResolveAsyncEventOfPromise(prePromiseId, postEventRootId);
    const isNested = !!nestedPromiseId;
    const isChainedToRoot = util.isPromiseChainedToRoot(preEventRunId, postPromiseId);
    // const isNestedChain = this.isNestedChain(nestedPromiseId, schedulerTraceId);
    // const nestedUpdate = nestedPromiseId && dp.util.getPreviousPostAsyncEventOfPromise(nestedPromiseId, postEventRootId);
    // const { rootId: nestedRootId } = nestedUpdate ?? EmptyObject;

    return {
      preEventUpdate,
      previousPostUpdate,
      isNested,
      isChainedToRoot
    };
  },

  /** @param {DataProvider} dp */
  getPostCallbackData(dp, postEventUpdate) {
    const { util } = dp;
    const {
      // runId: postEventRunId,
      rootId,
      schedulerTraceId
    } = postEventUpdate;

    const preEventUpdate = util.getAsyncPreEventUpdateOfTrace(schedulerTraceId);

    if (!preEventUpdate) {
      // should never happen!
      dp.logger.warn(`[postAwait] "getAsyncPreEventUpdateOfTrace" could not find anything for schedulerTraceId=${schedulerTraceId}:`, postEventUpdate);
      return null;
    }

    const { isEventListener } = preEventUpdate;

    const isNested = false;
    let eventHandlerThreadId;
    let recursiveThreadId;
    let firstPostEventHandlerUpdate;
    let lastPostUpdate;
    if (isEventListener) {
      // event listener
      firstPostEventHandlerUpdate = util.getFirstAsyncPostEventUpdateOfTrace(schedulerTraceId);
      if (firstPostEventHandlerUpdate) {
        eventHandlerThreadId = util.getAsyncRootThreadId(firstPostEventHandlerUpdate.rootId);
      }
    }
    else {
      // recursive callbacks
      lastPostUpdate = util.getPreviousAsyncPostEventUpdateOfTrace(schedulerTraceId, rootId);
      if (lastPostUpdate) {
        // the same callback was called multiple times -> check if the same function is called
        const thisStaticContextId = util.getContextStaticContext(rootId);
        const lastStaticContextId = util.getContextStaticContext(lastPostUpdate.rootId);
        if (thisStaticContextId === lastStaticContextId) {
          recursiveThreadId = util.getAsyncRootThreadId(lastPostUpdate.rootId);
        }
      }
    }

    return {
      preEventUpdate,
      isNested,
      firstEventHandlerUpdate: firstPostEventHandlerUpdate,
      eventHandlerThreadId,
      lastEventHandlerUpdate: lastPostUpdate,
      recursiveThreadId
    };
  },

  /** @param {DataProvider} dp */
  getPostEventUpdateData(dp, postEventUpdate) {
    if (AsyncEventUpdateType.is.PostAwait(postEventUpdate.type)) {
      return dp.util.getPostAwaitData(postEventUpdate);
    }
    if (AsyncEventUpdateType.is.PostThen(postEventUpdate.type)) {
      return dp.util.getPostThenData(postEventUpdate);
    }
    if (AsyncEventUpdateType.is.PostCallback(postEventUpdate.type)) {
      return dp.util.getPostCallbackData(postEventUpdate);
    }
    throw new Error(`Invalid AsyncEventUpdateType for postEventUpdate: ${JSON.stringify(postEventUpdate)}`);
  }
};

