import findLast from 'lodash/findLast';
import groupBy from 'lodash/groupBy';
import isNumber from 'lodash/isNumber';
import truncate from 'lodash/truncate';
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
// eslint-disable-next-line max-len
import ValueTypeCategory, { isObjectCategory, isPlainObjectOrArrayCategory, isFunctionCategory, ValuePruneState, getSimpleTypeString } from '@dbux/common/src/types/constants/ValueTypeCategory';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import SpecialCallType from '@dbux/common/src/types/constants/SpecialCallType';
import { parseNodeModuleName } from '@dbux/common-node/src/util/pathUtil';
import AsyncEventUpdateType, { isPostEventUpdate, isPreEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import { locToString } from './util/misc';
import { makeContextSchedulerLabel, makeTraceLabel } from './helpers/makeLabels';

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
    let parentContextId;
    while ((parentContextId = executionContexts.getById(contextId).parentContextId)) {
      contextId = parentContextId;
    }
    return executionContexts.getById(contextId);
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

  /** @param {DataProvider} dp */
  isRootContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    if (!context.parentContextId || context.isVirtualRoot) {
      return true;
    }
    return false;
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

  /**
   * Find a context's parent in call stack, skips virtual contexts and looking for async parent if it is a root context.
   * NOTE: used in `AsyncCallStack`, `RootEdgesTDNode` and `ParentContext navigation` for consistency
   * @param {DataProvider} dp 
   * @param {number} contextId 
   */
  getContextAsyncStackParent(dp, contextId) {
    const { parentContextId, type } = dp.collections.executionContexts.getById(contextId);
    if (!dp.util.isRootContext(contextId)) {
      // not a root, get real parent
      return dp.util.getRealContextOfContext(parentContextId);
    }
    else {
      // is root, looking for async parent
      // go to "real parent"
      if (isRealContextType(type)) {
        // if not virtual: go to async node's schedulerTrace
        // 1. get from node via asyncEdges
        // 2. get AsyncNode n of rootId = from
        const fromAsyncEvent = dp.indexes.asyncEvents.to.getFirst(contextId);
        return dp.collections.executionContexts.getById(fromAsyncEvent?.fromRootContextId);
      }
      else {
        // if virtual: skip to realContext's parent and call trace (skip all virtual contexts, in general)
        const realContext = dp.util.getRealContextOfContext(contextId);
        return dp.util.getRealContextOfContext(realContext.parentContextId);
      }
    }
  },

  /** @param {DataProvider} dp */
  searchContexts(dp, searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    return dp.util.getAllExecutedStaticContexts().
      filter(staticContext => {
        return staticContext.displayName?.toLowerCase().includes(searchTerm);
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
        const staticTraces = dp.util.getExecutedStaticTracesInStaticContext(staticContext.staticContextId) || EmptyArray;
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
      dp.collections.executionContexts.getAllActual().map(context => {
        const { staticContextId } = context;
        return staticContextId;
      })
    );
    return Array.from(staticContextIds);
  },

  getAllExecutedStaticContexts(dp) {
    const staticContextIds = dp.util.getAllExecutedStaticContextIds();
    return staticContextIds.map(staticContextId =>
      dp.collections.staticContexts.getById(staticContextId));
  },

  // getAllExecutedStaticTraces(dp) {
  //  // NIY
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

  /**
   * Collects error traces from three sources:
   *  1. valueRef.isError
   *  2. trace.type === TraceType.ThrowArgument
   *  3. trace.error === true
   * @see https://github.com/Domiii/dbux/issues/561 for more details
   * @param {DataProvider} dp
   */
  getAllErrorTraces(dp) {
    const allErrorTraces = new Set();

    // valueRef.isError -> first occurrence of that error
    const errValueRefs = dp.indexes.values.error.get(1) || EmptyArray;
    errValueRefs.forEach(({ nodeId }) => {
      const errorTrace = dp.util.getTraceOfDataNode(nodeId);
      allErrorTraces.add(errorTrace);
    });

    // trace.type === TraceType.ThrowArgument
    const throwTraces = dp.indexes.traces.byType.get(TraceType.ThrowArgument);
    throwTraces.forEach(t => allErrorTraces.add(t));

    // trace.error === true;
    const popErrorTraces = dp.indexes.traces.error.get(1);
    popErrorTraces.forEach(t => allErrorTraces.add(t));

    return Array.from(allErrorTraces).sort((a, b) => a.traceId - b.traceId);
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
    const valueTrace = dp.util.getValueTrace(traceId);
    return dp.indexes.dataNodes.byTrace.get(valueTrace.traceId);
  },

  /** @param {DataProvider} dp */
  getOwnDataNodeOfTrace(dp, traceId) {
    const trace = dp.util.getTrace(traceId);
    return dp.collections.dataNodes.getById(trace.nodeId);
  },

  /** @param {DataProvider} dp */
  getInputIdsOfTrace(dp, traceId) {
    const dataNode = dp.util.getOwnDataNodeOfTrace(traceId);
    return dataNode?.inputs;
  },

  /** @param {DataProvider} dp */
  getFirstInputDataNodeOfTrace(dp, traceId) {
    const inputIds = dp.util.getInputIdsOfTrace(traceId);
    return inputIds?.length ? dp.collections.dataNodes.getById(inputIds[0]) : null;
  },

  /**
   * @param {DataProvider} dp
   * @return {DataNode} DataNode of value trace
   */
  getDataNode(dp, nodeId) {
    return dp.collections.dataNodes.getById(nodeId);
  },

  /**
   * @param {DataProvider} dp
   * @return {DataNode} DataNode of value trace
   */
  getTraceOfDataNode(dp, nodeId) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (!dataNode) {
      return undefined;
    }
    const { traceId } = dataNode;
    return dp.util.getTrace(traceId);
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
    if (!trace) {
      dp.logger.trace(`invalid traceId does not have a trace:`, traceId);
      return trace;
    }
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
   * @param {DataProvider} dp
   */
  constructValueFull(dp, nodeId, _refId, _value, _visited, _rootNodeId) {
    const isRoot = !_visited;
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (isRoot) {
      _visited = new Set();
      ({ refId: _refId } = dataNode);
      _rootNodeId = nodeId;
    }

    let valueRef;
    if (_refId) {
      valueRef = dp.collections.values.getById(_refId);
      if (_visited.has(_refId)) {
        return '(circular dependency)';
      }
      _visited.add(_refId);
    }

    let finalValue;
    if (!_refId) {
      finalValue = _value;
    }
    else {
      const entries = Object.entries(dp.util.constructValueObjectShallow(_refId, _rootNodeId));
      const constructedEntries = entries.map(([key, [childNodeId, childRefId, childValue]]) => {
        return [key, dp.util.constructValueFull(childNodeId, childRefId, childValue, _visited, _rootNodeId)];
      });

      if (ValueTypeCategory.is.Array(valueRef.category)) {
        finalValue = [];
        constructedEntries.forEach(([key, value]) => finalValue[key] = value);
      }
      else {
        finalValue = Object.fromEntries(constructedEntries);
      }
    }

    return finalValue;
  },

  _fixNonTrackableValue(value) {
    // if (isString(value)) {
    //   return value.replace('\n');//
    // }
    return value;
  },

  /**
   * @param {DataProvider} dp
   * @return {{prop: number}} returns the `prop`, `nodeId` key-value pairs
   */
  constructValueObjectShallow(dp, refId, terminateNodeId = Infinity) {
    const valueRef = dp.collections.values.getById(refId);

    /**
     * initial values
     * NOTE: valueRef.value is an array of the same format as the one below, produced by {@link ValueRefCollection.deserializeShallow}
     */
    let entries;
    const { category } = valueRef;
    if (ValueTypeCategory.is.Array(category)) {
      entries = [];
      Object.entries(valueRef.value).forEach(([prop, val]) => entries[prop] = val);
    }
    else {
      entries = { ...valueRef.value };
    }

    // if (!entries) {
    //   // sanity check
    //   dp.logger.error(`Cannot construct non-object valueRef: ${JSON.stringify(valueRef)}`);
    // }

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
          const inputNodeId = modifyNode.inputs[0];
          const inputNode = dp.collections.dataNodes.getById(inputNodeId);
          entries[prop] = [modifyNode.nodeId, null, inputNode.value];
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
   * Handle special circumstances.
   */
  getDataNodeValueMessage(dp, nodeId) {
    const valueRef = dp.util.getDataNodeValueRef(nodeId);
    if (valueRef?.pruneState === ValuePruneState.Omitted) {
      return `(omitted value)`;
    }
    return null;
  },

  /** 
   * internal helper
   * @param {DataProvider} dp
   */
  _simplifyValue(dp, [nodeId, refId, value]) {
    if (refId) {
      const valueRef = dp.collections.values.getById(refId);
      const { category } = valueRef;
      if (isObjectCategory(category)) {
        return getSimpleTypeString(category);
      }
      else {
        return String(valueRef.value);
      }
    }
    else {
      return String(value);
    }
  },

  /** 
   * @param {DataProvider} dp
   */
  getDataNodeValueString(dp, nodeId, shorten = false) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    const ShortenMaxLength = 20;

    // check cached string
    if (shorten) {
      if (dataNode._valueStringShort) {
        return dataNode._valueStringShort;
      }
    }
    else if (dataNode._valueString) {
      return dataNode._valueString;
    }

    // A message is generated if there is an issue with the value or it was omitted.
    const valueMessage = dp.util.getDataNodeValueMessage(nodeId);
    if (valueMessage) {
      return valueMessage;
    }

    // get value
    let valueString;
    const { refId } = dataNode;
    if (refId) {
      const entries = dp.util.constructValueObjectShallow(refId);
      const valueRef = dp.collections.values.getById(refId);
      const { category } = valueRef;
      if (ValueTypeCategory.is.Array(category)) {
        let content = `${entries.map(x => dp.util._simplifyValue(x))}`;
        shorten && (content = truncate(content, { length: ShortenMaxLength - 2 }));
        valueString = `[${content}]`;
      }
      else if (ValueTypeCategory.is.Object(category)) {
        let content = `${Object.keys(entries)}`;
        shorten && (content = truncate(content, { length: ShortenMaxLength - 2 }));
        valueString = `{${content}}`;
      }
      else if (ValueTypeCategory.is.Function(category)) {
        let content = entries.name?.[2] || '(anonymous)';
        shorten && (content = truncate(content, { length: ShortenMaxLength - 2 }));
        valueString = `ƒ ${content}`;
      }
      else {
        valueString = valueRef.value?.toString?.() || String(valueRef.value);
      }
    }
    else {
      valueString = dataNode.value?.toString?.() || String(dataNode.value);
    }

    if (shorten) {
      valueString = truncate(valueString, { length: ShortenMaxLength });
      dataNode._valueStringShort = valueString;
    }
    else {
      dataNode._valueString = valueString;
    }

    return valueString;
  },

  /** @param {DataProvider} dp */
  getDataNodeValueStringShort(dp, nodeId) {
    return dp.util.getDataNodeValueString(nodeId, true);
  },

  /** @param {DataProvider} dp */
  getTraceValueString(dp, traceId) {
    const { nodeId } = dp.util.getDataNodeOfTrace(traceId);
    return dp.util.getDataNodeValueString(nodeId);
  },

  /** @param {DataProvider} dp */
  getTraceValueStringShort(dp, traceId) {
    const { nodeId } = dp.util.getDataNodeOfTrace(traceId);
    return dp.util.getDataNodeValueStringShort(nodeId);
  },

  /** @param {DataProvider} dp */
  getTraceRefId(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode?.refId || null;
  },

  /** @param {DataProvider} dp */
  getTraceValueRef(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.getDataNodeValueRef(dataNode.nodeId) : null;
  },

  /** @param {DataProvider} dp */
  getDataNodeValueRef(dp, nodeId) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (dataNode && dataNode.refId) {
      return dp.collections.values.getById(dataNode.refId);
    }
    return null;
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
   * NOTE: we use this to find the parent trace of a given context.
   * NOTE: if a trace is both `CallArgument` and `CallExpressionResult`, returns the argument trace.
   * @param {DataProvider} dp
   * @param {number} traceId
  */
  getPreviousCallerTraceOfTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
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
   * [sync]
   * Get callerTrace (BCE) of a call related trace, returns itself if it is not a call related trace.
   * Note: if a trace is both `CallArgument` and `CallExpressionResult`, returns the result trace.
   * @param {DataProvider} dp
   * @param {number} traceId
  */
  getBCETraceOfTrace(dp, traceId) {
    const { traces } = dp.collections;
    const trace = traces.getById(traceId);
    if (isCallResult(trace)) {
      // trace is call expression result
      return traces.getById(trace.resultCallId);
    }
    else if (hasCallId(trace)) {
      // trace is call/callback argument or BCE
      return traces.getById(trace.callId);
    }
    else {
      // not a call related trace
      return trace;
      // return null;
    }
  },

  /**
   * @param {DataProvider} dp
   */
  getCallIdOfTrace(dp, traceId) {
    return dp.util.getBCETraceOfTrace(traceId)?.traceId || null;
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

  getBCEResultTraceId(dp, callId) {
    const trace = dp.collections.traces.getById(callId);
    if (trace.resultId) {
      // trace is a BeforeCallExpression and has result
      return dp.collections.traces.getById(trace.resultId);
    }
    return null;
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
   * TODO: given the `nodeId` of (what should be) an array, return its element DataNodes.
   * 
   * @param {DataProvider} dp
   */
  getArrayDataNodes(dp, nodeId) {
    return [];
  },

  /**
   * NOTE: This works automatically for spread operator.
   *
   * @param {DataProvider} dp
   * @return Flattened version of DataNodes of `CallExpression` arguments.
   */
  getCallArgDataNodes(dp, callId) {
    const argTraces = dp.util.getCallArgTraces(callId);
    const { argConfigs } = dp.util.getStaticTrace(callId).data;
    if (!argTraces) {
      return EmptyArray;
    }
    let argDataNodes = argTraces.flatMap((t, i) => {
      const dataNodes = dp.util.getDataNodesOfTrace(t.traceId);
      if (!argConfigs[i]?.isSpread) {
        // not spread -> take the argument's own `DataNode`
        return dataNodes[0];
      }
      // spread -> take all of the spread argument's additional `DataNode`s (which are the argument DataNodes)
      return dataNodes.slice(1);
    });

    const bceTrace = dp.util.getTrace(callId);
    const callType = dp.util.getSpecialCallType(callId);
    switch (callType) {
      case SpecialCallType.Call:
        argDataNodes = argDataNodes.slice(1);
        break;
      case SpecialCallType.Apply:
        argDataNodes = dp.util.getArrayDataNodes(argDataNodes[1]);
        break;
      case SpecialCallType.Bind:
        // return as-is -> handle below in `Bound` case
        // argDataNodes = ;
        break;
    }

    if (bceTrace?.data.calleeTid) {
      // check for `Bound`
      const bindTrace = dp.util.getBindCallTrace(bceTrace.data.calleeTid);
      const boundArgNodes = bindTrace && dp.util.getCallArgDataNodes(bindTrace.traceId);
      if (boundArgNodes) {
        argDataNodes = [
          ...boundArgNodes || EmptyArray,
          ...argDataNodes
        ];
      }
    }

    return argDataNodes;
  },

  /**
   * Returns array of values of args, but only for primitive values.
   * Non-primitive argument values will be `undefined`.
   */
  getCallArgPrimitiveValues(dp, callId) {
    const dataNodes = dp.util.getCallArgDataNodes(callId);
    return dataNodes?.map(node => node.value);
  },

  /**
   * @param {DataProvider} dp
   * @return the ValueRef of given `context`'s BCE. We use it to get an `async` function call's own promise.
   */
  getCallValueRefOfContext(dp, contextId) {
    const bceTrace = dp.util.getOwnCallerTraceOfContext(contextId);
    return bceTrace && dp.util.getTraceValueRef(bceTrace.traceId) || null;
  },

  /**
   * @param {DataProvider} dp
   */
  getReturnValueRefOfInterruptableContext(dp, realContextId) {
    const returnTrace = dp.util.getReturnTraceOfInterruptableContext(realContextId);
    return returnTrace && dp.util.getTraceValueRef(returnTrace.traceId);
  },

  /**
   * @param {DataProvider} dp
   */
  getReturnValueRefOfContext(dp, contextId) {
    const returnTrace = dp.util.getReturnTraceOfContext(contextId);
    return returnTrace && dp.util.getTraceValueRef(returnTrace.traceId);
  },

  /**
   * @param {DataProvider} dp
   */
  getReturnTraceOfRealContext(dp, contextId) {
    if (dp.util.isContextVirtual(contextId)) {
      const realContextId = dp.util.getRealContextIdOfContext(contextId);
      return realContextId && dp.util.getReturnTraceOfInterruptableContext(realContextId);
    }
    else {
      return dp.util.getReturnTraceOfContext(contextId);
    }
  },

  /**
   * Requires the given context to have (virtual) child contexts.
   * WARNING: does not work for non-interruptable functions.
   * @param {DataProvider} dp
   */
  getReturnTraceOfInterruptableContext(dp, realContextId) {
    const contexts = dp.indexes.executionContexts.children.get(realContextId);
    if (contexts) {
      for (let i = contexts.length - 1; i >= 0; --i) {
        const returnTrace = dp.util.getReturnTraceOfContext(contexts[i].contextId);
        if (returnTrace) {
          return returnTrace;
        }
      }
    }
    return null;
  },

  /**
   * WARNING: does not work for `realContextId` of interruptable functions (need virtual `Resume` contextId instead).
   * @param {DataProvider} dp
   */
  getReturnTraceOfContext(dp, contextId) {
    let returnTraces = dp.util.getTracesOfContextAndType(contextId, TraceType.ReturnArgument);
    if (!returnTraces.length) {
      returnTraces = dp.util.getTracesOfContextAndType(contextId, TraceType.ReturnNoArgument);
    }

    if (returnTraces.length > 1) {
      // eslint-disable-next-line max-len
      dp.logger.warn(`Found context containing more than one ReturnArgument. contextId: ${contextId}, ReturnArgument traces at ${dp.util.makeTraceInfo(returnTraces[0])}: [${returnTraces.map(t => t.traceId)}]`);
    }
    return returnTraces[0] || null;
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
   * @param {DataProvider} dp
   */
  isCalleeTraced(dp, callId) {
    const context = dp.util.getCalledContext(callId);
    return context && !!dp.util.getOwnCallerTraceOfContext(context.contextId);
  },

  getCalledContext(dp, callId) {
    return dp.indexes.executionContexts.byCalleeTrace.getUnique(callId);
  },

  /**
   * @param {DataProvider} dp
   */
  getBindCallTrace(dp, functionTraceId) {
    const { getTraceValueRef, getFirstTraceByRefId, getBCETraceOfTrace } = dp.util;
    if (!functionTraceId) {
      // callee was not recorded
      return null;
    }
    // const trace = dp.util.getTrace(functionTraceId);
    // if (!trace) {
    //   dp.logger.warn(`invalid functionTraceId does not have a trace:`, functionTraceId/* , dp.collections.traces._all */);
    //   return null;
    // }
    const calleeRef = getTraceValueRef(functionTraceId);
    const originalTrace = calleeRef && getFirstTraceByRefId(calleeRef.refId);
    const bindTrace = originalTrace && getBCETraceOfTrace(originalTrace.traceId);
    if (bindTrace?.data?.specialCallType === SpecialCallType.Bind) {
      return bindTrace;
    }
    return null;
  },

  /**
   * @param {DataProvider} dp
   */
  getSpecialCallType(dp, callId) {
    const bceTrace = dp.util.getTrace(callId);
    if (!bceTrace?.data) {
      return null;
    }

    switch (bceTrace.data.specialCallType) {
      case SpecialCallType.Call:
      case SpecialCallType.Apply:
      case SpecialCallType.Bind:
        return bceTrace.data.specialCallType;
    }

    return null;
  },

  /**
   * Accounts for `call`, `apply`, `bind`.
   * @param {DataProvider} dp
   */
  getRealCalleeTrace(dp, callId) {
    const bceTrace = dp.util.getTrace(callId);
    if (!bceTrace?.data) {
      return null;
    }

    let realCalleeTid;
    const callType = dp.util.getSpecialCallType(callId);
    switch (callType) {
      case SpecialCallType.Call:
      case SpecialCallType.Apply:
        realCalleeTid = bceTrace.data.calledFunctionTid;
        break;
      case SpecialCallType.Bind: {
        // nothing to do here -> handle `Bound` case below
        break;
      }
    }

    // no match -> check for Bound
    const { calleeTid } = bceTrace.data;
    const bindTrace = dp.util.getBindCallTrace(calleeTid);
    if (bindTrace) {
      realCalleeTid = bindTrace.data.calledFunctionTid;
    }

    if (!realCalleeTid) {
      // default
      realCalleeTid = bceTrace.data.calleeTid;
    }
    else {
      // TODO: keep recursing in order to support arbitrary `bind` chains, e.g.: `f.bind.bind()`
    }

    return dp.collections.traces.getById(realCalleeTid);
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
    const callId = bceTrace.traceId;
    const calleeTrace = dp.util.getRealCalleeTrace(callId);
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
   * Return scheduler trace of a `root context` and return caller trace otherwise.
   * @param {DataProvider} dp
   */
  getCallerOrSchedulerTraceOfContext(dp, contextId) {
    if (dp.util.isRootContext(contextId)) {
      const asyncNode = dp.util.getAsyncNode(contextId);
      return dp.collections.traces.getById(asyncNode?.schedulerTraceId);
    }
    else {
      return dp.util.getCallerTraceOfContext(contextId);
    }
  },

  /**
   * NOTE: Used together with `util.getCallerOrSchedulerTraceOfContext`. Same logic but can't be simplify.
   * @param {DataProvider} dp
   */
  makeContextCallerOrSchedulerLabel(dp, contextId) {
    if (dp.util.isRootContext(contextId)) {
      const context = dp.collections.executionContexts.getById(contextId);
      return context && makeContextSchedulerLabel(context, dp) || '';
    }
    else {
      const callerTrace = dp.util.getCallerTraceOfContext(contextId);
      return callerTrace && makeTraceLabel(callerTrace) || '';
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
  getLastChildContextOfContext(dp, realContextId) {
    return dp.indexes.executionContexts.children.getLast(realContextId);
  },

  /** @param {DataProvider} dp */
  getRealContextIdOfTrace(dp, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    return dp.util.getRealContextIdOfContext(contextId);
  },

  /** @param {DataProvider} dp */
  getRealContextIdOfContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const { parentContextId } = context;
    let parentContext;

    if (isRealContextType(context.contextType)) {
      return contextId;
    }
    else if (
      (parentContext = dp.collections.executionContexts.getById(parentContextId)) &&
      isRealContextType(parentContext.contextType)
    ) {
      return parentContextId;
    }
    else {
      dp.logger.trace('Could not find realContext for contextId', contextId);
      return null;
    }
  },

  /** @param {DataProvider} dp */
  getRealContextOfContext(dp, contextId) {
    return dp.collections.executionContexts.getById(dp.util.getRealContextIdOfContext(contextId));
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
    if (!context) {
      throw new Error(`getContextStaticContextId failed - invalid contextId: ${contextId}`);
    }
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

  /** @param {DataProvider} dp */
  isFirstContextInParent(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const { parentContextId } = context;
    if (parentContextId) {
      return dp.indexes.executionContexts.children.getFirst(parentContextId) === context;
    }
    return false;
  },

  /** @param {DataProvider} dp */
  getRealCalledContext(dp, callId) {
    const calledContext = dp.util.getCalledContext(callId);
    const contextId = calledContext && dp.util.getRealContextIdOfContext(calledContext.contextId);
    return contextId && dp.collections.executionContexts.getById(contextId);
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
  isContextVirtual(dp, contextId) {
    const staticContext = dp.util.getContextStaticContext(contextId);
    const {
      type: staticContextType
    } = staticContext;
    return isVirtualContextType(staticContextType);
  },

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
   * future-work: improve performance, use MultiKeyIndex instead
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
   * @param {DataProvider} dp
   */
  makeTraceInfo(dp, traceOrTraceOrTraceId) {
    // const { traceId } = trace;
    let trace;
    if (isNumber(traceOrTraceOrTraceId)) {
      trace = dp.collections.traces.getById(traceOrTraceOrTraceId);
    }
    else {
      trace = traceOrTraceOrTraceId;
    }
    if (!trace) {
      return `#${traceOrTraceOrTraceId} (null)`;
    }
    const { traceId } = trace;
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
  //     dp.util.getRealContextIdOfTrace(traceId),

  //     dp.util.getLastTraceInRealContext(dp.util.getRealContextIdOfTrace(traceId))?.traceId,
  //     dp.util.getLastStaticTraceInContext(dp.collections.staticTraces.getById(staticTraceId).staticContextId)?.staticTraceId,

  //     // is last trace we have recorded in context
  //     dp.util.isLastTraceInRealContext(traceId),

  //     // but is not last trace in the code
  //     !dp.util.isLastStaticTraceInContext(staticTraceId),

  //     // the context must have popped (finished), or else there was no error (yet)
  //     dp.util.hasRealContextPopped(dp.util.getRealContextIdOfTrace(traceId)));

  //   // is not a return trace (because return traces indicate function succeeded)
  //   return !isReturnTrace(traceType) &&

  //     // is last trace we have recorded in context
  //     dp.util.isLastTraceInRealContext(traceId) &&

  //     // but is not last trace in the code
  //     !dp.util.isLastStaticTraceInContext(staticTraceId) &&

  //     // the context must have popped (finished), or else there was no error (yet)
  //     dp.util.hasRealContextPopped(dp.util.getRealContextIdOfTrace(traceId));
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
   * @param {DataProvider} dp
   */
  isContextTraced(dp, contextId) {
    const { tracesDisabled } = dp.util.getExecutionContext(contextId);
    return !tracesDisabled;
  },

  // ###########################################################################
  // graph traversal
  // ###########################################################################

  /** @param {DataProvider} dp */
  traverseDfs(dp, contexts, dfsRecurse, preOrderCb, postOrderCb) {
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
    const rootIds = new Set(
      contexts.filter(c => !c.parentContextId || c.isVirtualRoot)
      // .map(c => );
    );
    for (const roots of rootIds) {
      dfs(roots);
    }
  },

  /** @param {DataProvider} dp */
  getChildrenOfContext(dp, contextId) {
    return dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
  },

  // ###########################################################################
  // labels
  // ###########################################################################

  /** @param {DataProvider} dp */
  makeTypeNameLabel(dp, traceId) {
    const traceType = dp.util.getTraceType(traceId);
    const typeName = TraceType.nameFrom(traceType);
    return `[${typeName}]`;
  },

  // ###########################################################################
  // async
  // ###########################################################################

  /** @param {DataProvider} dp */
  getAsyncNode(dp, rootId) {
    return dp.indexes.asyncNodes.byRoot.getUnique(rootId);
  },


  /** @param {DataProvider} dp */
  getAsyncRootThreadId(dp, rootId) {
    return dp.indexes.asyncNodes.byRoot.getUnique(rootId)?.threadId;
  },

  getStaticContextCallbackThreadId(dp, rootId) {
    return dp.indexes.asyncNodes.byRoot.getUnique(rootId)?.threadId;
  },

  /** @param {DataProvider} dp */
  getChainFrom(dp, fromRootId) {
    const fromEdges = dp.indexes.asyncEvents.from.get(fromRootId);
    return fromEdges?.filter(edge => edge.edgeType === AsyncEdgeType.Chain) || EmptyArray;
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

  /** @param {DataProvider} dp */
  getLastAsyncPostEventUpdateOfTrace(dp, schedulerTraceId, beforeRootId) {
    const updates = dp.indexes.asyncEventUpdates.byTrace.get(schedulerTraceId);
    return findLast(updates, upd => upd.rootId <= beforeRootId && isPostEventUpdate(upd.type));
  },

  /** @param {DataProvider} dp */
  getLastAsyncPostEventUpdateOfPromise(dp, promiseId, beforeRootId) {
    const updates = dp.indexes.asyncEventUpdates.byPromise.get(promiseId);
    return findLast(updates, upd => isPostEventUpdate(upd.type) && upd.rootId < beforeRootId);
  },

  /** @param {DataProvider} dp */
  getFirstNestingPreAwaitUpdate(dp, promiseId) {
    const updates = dp.indexes.asyncEventUpdates.byNestedPromise.get(promiseId);
    return updates?.[0];
  },

  /** @param {DataProvider} dp */
  getAsyncPreEventUpdateOfPromise(dp, promiseId) {
    const updates = dp.indexes.asyncEventUpdates.byPromise.get(promiseId);
    return updates?.[0];
  },

  /** 
   * Get the last "Post" asyncEvent of given `schedulerTraceId`.
   * That update must have `rootId` < `beforeRootId`.
   * 
   * @param {DataProvider} dp
   */
  getPreviousAsyncEventUpdateOfTrace(dp, schedulerTraceId, beforeRootId) {
    const updates = dp.indexes.asyncEventUpdates.byTrace.get(schedulerTraceId);
    return updates && findLast(updates, update => update.rootId < beforeRootId) || EmptyArray;
  },

  getAsyncPreEventUpdatesOfRoot(dp, rootId) {
    const updates = dp.indexes.asyncEventUpdates.byRoot.get(rootId);
    return updates?.filter(upd => isPreEventUpdate(upd.type)) || EmptyArray;
  },

  // TODO!
  // /** 
  //  * Get the last "Post" asyncEvent of given `schedulerTraceId`.
  //  * That update must have `rootId` < `beforeRootId`.
  //  * 
  //  * @param {DataProvider} dp
  //  */
  // getAsyncPreEventUpdatesOfRoot(dp, schedulerTraceId, rootId) {
  //   const updates = dp.indexes.asyncEventUpdates.byTrace.get(schedulerTraceId);
  //   return updates && findLast(updates, update => update.rootId < beforeRootId);
  // },

  /**
   * Get the last "Post" asyncEvent (also an "edge trigger event") of a given promise.
   * That update must have `rootId` < `beforeRootId`.
   * Recurse if nested.
   *
   * @deprecated
   * @param {DataProvider} dp
   * @return {AsyncEventUpdate}
   */
  getPreviousPostOrResolveAsyncEventOfPromise(dp, promiseId, beforeRootId, _visited = new Set()) {
    if (_visited.has(promiseId)) {
      // TODO: observe this. can happen if a promise returns itself etc.
      dp.logger.trace(`[getPreviousPostOrResolveAsyncEventOfPromise] circular promiseId: ${promiseId} (visited=[${Array.from(_visited).join(', ')}])`);
      return null;
    }
    _visited.add(promiseId);
    // TODO: prefer pre-chained event (post event that was first scheduled, rather than last executed)
    let postUpdate = dp.util.getLastAsyncPostEventUpdateOfPromise(promiseId, beforeRootId);
    let nestedPromiseId;

    // recurse on nested promises:
    if (postUpdate && AsyncEventUpdateType.is.PostThen(postUpdate.type)) {
      if (postUpdate.nestedPromiseId) {
        // Case 1: promise returned a nested promise from `then` callback -> go down the tree
        nestedPromiseId = postUpdate.nestedPromiseId;
      }
    }
    else {
      // (maybe) Case 2: returned promise from `async` function
      // NOTE: we are making sure, this is the "returning" postUpdate
      let resumeContextId;
      if (postUpdate && AsyncEventUpdateType.is.PostAwait(postUpdate.type)) {
        // async function has at least one `await`
        resumeContextId = postUpdate.contextId;
      }
      else {
        // async function had no `await`: find call trace -> called context
        const asyncCallResultTrace = dp.util.getFirstTraceByRefId(promiseId);
        const callId = asyncCallResultTrace && dp.util.getCallIdOfTrace(asyncCallResultTrace.traceId);
        const resumeContext = callId && dp.util.getCalledContext(callId);
        resumeContextId = resumeContext?.contextId;
      }

      if (resumeContextId) {
        const returnValueRef = dp.util.getReturnValueRefOfContext(resumeContextId);
        // const returnValueRef = dp.util.getReturnValueRefOfInterruptableContext(resumeContextId);
        if (returnValueRef?.isThenable) {
          nestedPromiseId = returnValueRef.refId;
        }
      }
    }
    postUpdate = nestedPromiseId &&
      dp.util.getPreviousPostOrResolveAsyncEventOfPromise(nestedPromiseId, beforeRootId, _visited) ||
      postUpdate;

    return postUpdate;
  },

  // /** @param {DataProvider} dp */
  // getFirstPostOrResolveAsyncEventOfPromise(dp, promiseId) {
  //   return dp.indexes.asyncEventUpdates.byPromise.getFirst(promiseId);
  // },


  /**
   * @deprecated
   * @param {DataProvider} dp 
   */
  isNestedChain(dp, nestedPromiseId, schedulerTraceId) {
    const nestingPromiseRunId = nestedPromiseId && dp.util.getFirstTraceByRefId(nestedPromiseId)?.runId;
    const firstNestingAsyncUpdate = nestingPromiseRunId && dp.util.getFirstNestingAsyncUpdate(nestingPromiseRunId, nestedPromiseId);
    const firstNestingTraceId = firstNestingAsyncUpdate?.schedulerTraceId;
    return firstNestingTraceId && firstNestingTraceId === schedulerTraceId || false;
  },

  /** 
   * Return all updates that are nesting the given promise `p` (of given `promiseId`), in run of given `runId`.
   * For {Pre,Post}Await: any updates of type `await p`.
   * For PostThen: updates that `return p`.
   *
   * @deprecated
   * @param {DataProvider} dp
   */
  getNestingAsyncUpdates(dp, runId, promiseId) {
    const eventKey = [runId, promiseId];
    return dp.indexes.asyncEventUpdates.byNestedPromiseAndRun.get(eventKey);
  },

  /** 
   * @deprecated
   * @param {DataProvider} dp 
   */
  getFirstNestingAsyncUpdate(dp, runId, promiseId) {
    // TODO: this currently accounts for PreAwait, PostAwait, PostThen. Probably need to change to `PreAwait` + `PreThen`
    return dp.util.getNestingAsyncUpdates(runId, promiseId)?.[0] || null;
  },

  /**
   * Returns `0` if `ref` is not thenable.
   * Otherwise returns `refId`.
   * 
   * @param {DataProvider} dp
   */
  getPromiseIdOfValueRef(dp, refId) {
    return dp.util.getPromiseValueRef(refId)?.refId || 0;
  },

  getPromiseValueRef(dp, refId) {
    let ref = dp.collections.values.getById(refId);
    if (ref?.isThenable) {
      return ref;
    }
    return 0;
  },


  // /**
  //  * If not an async function, returns `0` .
  //  * If the function returned a promise, returns its `promiseId`.
  //  * Otherwise, returns the `promiseId` of the function's CallExpressionResult.
  //  * 
  //  * @param {DataProvider} dp
  //  */
  // getAsyncFunctionPromiseId(dp, contextId) {
  //   const realContextId = dp.util.getRealContextIdOfContext(contextId);
  //   const staticContext = realContextId && dp.util.getContextStaticContext(realContextId);
  //   if (!staticContext?.isInterruptable) {
  //     return 0;
  //   }

  //   // first: get returned `promiseId`
  //   const returnTrace = dp.util.getReturnTraceOfInterruptableContext(realContextId);
  //   const returnedDataNode = returnTrace && dp.util.getFirstInputDataNodeOfTrace(returnTrace.traceId);
  //   let promiseId = returnedDataNode?.refId && dp.util.getPromiseIdOfValueRef(returnedDataNode.refId);

  //   if (!promiseId) {
  //     // else: get `promiseId` of the call result value.

  //     // TODO: this might work correctly for async getters
  //     //  -> test with `await2b-async-getters.js`
  //     const callTrace = dp.util.getCallerTraceOfContext(contextId);
  //     const callResultTrace = callTrace && dp.util.getValueTrace(callTrace.traceId);
  //     const refId = callResultTrace && dp.util.getTraceRefId(callResultTrace.traceId);
  //     promiseId = refId && dp.util.getPromiseIdOfValueRef(refId);
  //   }

  //   return promiseId;
  // },

  /** @param {DataProvider} dp */
  getAsyncStackRoots(dp, traceId) {
    const roots = [];
    // // skip first virtual context
    // const realContextId = dp.util.getRealContextIdOfTrace(traceId);
    // let currentContext = dp.collections.executionContexts.getById(realContextId);
    let currentContext = dp.util.getTraceContext(traceId);
    while (currentContext) {
      roots.push(currentContext);
      currentContext = dp.util.getContextAsyncStackParent(currentContext.contextId);
    }
    roots.reverse();
    return roots;
  },

  /** @param {DataProvider} dp */
  isAsyncNodeTerminalNode(dp, asyncNodeId) {
    const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
    const preEventUpdates = dp.util.getAsyncPreEventUpdatesOfRoot(asyncNode.rootContextId);
    return !preEventUpdates.length;
  },

  // ###########################################################################
  // promise tree
  // ###########################################################################

  // /**
  //  * @param {DataProvider} dp
  //  */
  // getNestingPromiseId(dp, innerPromiseId) {

  // },

  // /**
  //  * @param {DataProvider} dp
  //  */
  // getNestedPromiseId(dp, outerPromiseId) {

  // },

  // /**
  //  * @param {DataProvider} dp
  //  */
  // getAsyncRealContextIdOfOwnPromise(dp, promiseId) {

  // },

  /**
   * Walks up the stack to find out whether the given promise was `await`-chained to the (shared pre-event) root.
   * NOTE: given promise is either result of a first `then`, or the context's `promiseId` of a first `await`.
   * 
   * @param {DataProvider} dp
   */
  isPromiseChainedToRoot(dp, runId, contextId, promiseId) {
    //  -> check if `promiseId` was returned or awaited, and keep going up

    // TODO: link `promiseId`s in post processing
    //    fix for promises that don't have their own Post* AsyncEvent (e.g. `Promise.resolve().then`)
    //    maybe such that `getFirstNestingAsyncUpdate` can work when returning a promise from async function?


    const firstNestingAsyncUpdate = dp.util.getFirstNestingAsyncUpdate(runId, promiseId);
    if (!firstNestingAsyncUpdate) {
      // const  getAsyncFunctionPromiseId
      //   // check for `return f()` instead of `await f()`
      //   //  -> caller of -> context of -> return value ref of parent function (function that called f)
      //   const parentCallResultTrace = dp.util.getFirstTraceByRefId(promiseId);
      //   const parentCallId = parentCallResultTrace && dp.util.getCallIdOfTrace(parentCallResultTrace.traceId);
      //   const parentContext = parentCallId && dp.util.getRealCalledContext(parentCallId);
      //   const parentRealContextId = parentContext?.contextId;
      //   const parentReturnTrace = parentRealContextId && dp.util.getReturnTraceOfInterruptableContext(parentRealContextId);
      //   const parentReturnCallId = parentReturnTrace && dp.util.getCallIdOfTrace(parentReturnTrace.traceId);
      //   const context = parentReturnCallId && dp.util.getRealCalledContext(parentReturnCallId);
      //   if (context?.contextId && context.contextId === dp.util.getRealContextIdOfContext(contextId)) {
      //     return true;
      //   }
      return false;
    }

    const { contextId: parentContextId, rootId, promiseId: parentPromiseId } = firstNestingAsyncUpdate;

    if (parentContextId === rootId) {
      // root
      return true;
    }

    if (parentPromiseId) {
      // contextId !== rootId -> (most likely?) a first await
      return dp.util.isPromiseChainedToRoot(runId, parentContextId, parentPromiseId);
    }

    return false;
  },

  /** ###########################################################################
   * new async promise linkage
   *  #########################################################################*/

  /** @param {DataProvider} dp */
  getPromiseRootId(dp, promiseId) {
    const traceId = dp.util.getFirstTraceIdByRefId(promiseId);
    return traceId && dp.util.getRootContextOfTrace(traceId);
  },

  /** 
   * `getNestedPromiseUpdate`.
   * Returns the inner most nested promise that has a Post* update, nested by `toPromiseId`.
   * NOTE: `fromPromiseId` is already settled.
   * 
   * @param {DataProvider} dp
   */
  GNPU(dp, nestingPromiseId, beforeRootId, syncPromiseIds, visited = new Set()) {
    if (visited.has(nestingPromiseId)) {
      return null;
    }
    visited.add(nestingPromiseId);

    // TODO: check beforeRootId vs. link.rootId?

    let nestedUpdate = dp.util.getLastAsyncPostEventUpdateOfPromise(nestingPromiseId, beforeRootId);

    // Case 1: link is AsyncReturn, nestedUpdate is PostAwait
    // Case 2: link is AsyncReturn, nestedUpdate is PostThen
    // Case 3: link is ThenNested, nestedUpdate is PostAwait
    // Case 4: link is ThenNested, nestedUpdate is PostThen

    if (nestedUpdate && dp.util.getPromiseRootId(nestingPromiseId) < nestedUpdate.rootId) {
      // nested for synchronization -> do not go deeper
      // TODO: probably should only sync in some cases (sync here for PostAwait, don't sync here for PostThen?)
      syncPromiseIds.push(nestingPromiseId);
    }
    else {
      const link = dp.indexes.promiseLinks.to.getUnique(nestingPromiseId);
      if (link) {
        // try to go deeper
        nestedUpdate = dp.util.GNPU(link.from, beforeRootId, syncPromiseIds, visited) || nestedUpdate;
      }
    }
    if (!nestedUpdate) {
      // maybe the given promise did not have a recorded Post* update, but it's predecessor might have
      // -> could be because (i) the update happened inside an untraced module, or (ii) a reject/throw skipped it
      // const u = dp.util.getAsyncPreEventUpdateOfPromise(nestingPromiseId, beforeRootId);
      const u = dp.indexes.asyncEventUpdates.preUpdatesByPostEventPromise.getUnique(nestingPromiseId);
      if (u) {
        if (AsyncEventUpdateType.is.PreThen(u.type)) {
          // go to previous promise in promise tree
          const preThenPromiseId = u.promiseId;
          return dp.util.GNPU(preThenPromiseId, beforeRootId, syncPromiseIds, visited);
        }
        else if (AsyncEventUpdateType.is.PreAwait(u.type)) {
          // go to nested promise of first await
          return dp.util.GNPU(u.nestedPromiseId, beforeRootId, syncPromiseIds, visited);
        }
      }
    }
    return nestedUpdate;
  },

  /** 
   * Find rootId of last Post* update of top-most promise that nests promise of given `promiseId`.
   * Nesting must be during given `rootId`. Post* update must be before `rootId`.
   * 
   * @param {DataProvider} dp
   */
  UP(dp, nestedPromiseId, rootId, syncPromiseIds) {
    let u;
    const link = dp.indexes.promiseLinks.from.getFirst(nestedPromiseId);
    if (link) {
      // “Nested PostThen” or “async return” or “resolve”
      // TODO: define + assure correct timing via rootId
      const { to: outerPromiseId/* , rootId */ } = link;
      if ((u = dp.util.getLastAsyncPostEventUpdateOfPromise(outerPromiseId, rootId))) {
        // “Nested PostThen” or “async return”
        return u.rootId;
      }
      // “async return” (of function where no `await` executed) or “resolve”
      return dp.util.UP(outerPromiseId, rootId, syncPromiseIds);
    }
    else if ((u = dp.util.getFirstNestingPreAwaitUpdate(nestedPromiseId))) {
      // p was AWAIT’ed && PostAwait has not happened yet
      if (u.rootId > rootId) {
        // SYNC edge => already added in u's own Post* event handler
        // syncPromiseIds.push(u.promiseId);
        return 0;
      }
      else {
        // u.rootId === rootId
        //  (u.rootId < rootId is impossible because if `u` nests `p`, `u` cannot occur before `p`)
        const isFirstAwait = dp.util.isFirstContextInParent(u.contextId);
        if (!isFirstAwait || u.contextId === u.rootId) {
          return u.rootId;  // already at root (can't go up any further)
        }
        return dp.util.UP(u.promiseId, rootId, syncPromiseIds) || 0;
      }
    }
    else if ((u = dp.util.getAsyncPreEventUpdateOfPromise(nestedPromiseId, rootId)) && AsyncEventUpdateType.is.PreThen(u.type)) {
      // promise is not nested but was THEN’ed -> follow down the THEN chain (until we find a promise that is nested)
      return dp.util.UP(u.postEventPromiseId, rootId, syncPromiseIds);
    }

    // NOTE: if nestedPromiseId is nested but there is no Post event, return 0
    return 0;
  },

  /** @param {DataProvider} dp */
  DOWN(dp, promiseId, beforeRootId, syncPromiseIds) {
    return dp.util._DOWN(promiseId, beforeRootId, syncPromiseIds)?.rootId || 0;
  },

  /**
   *  @param {DataProvider} dp
   * NOTE: promiseId is ensured to be settled because promiseId is settled
   */
  _DOWN(dp, promiseId, beforeRootId, syncPromiseIds, visited = new Set()) {
    const nestedUpdate = dp.util.GNPU(promiseId, beforeRootId, syncPromiseIds, visited);
    if (!nestedUpdate) {
      return null;
    }

    // 
    return dp.util._DOWN(nestedUpdate.promiseId, beforeRootId, syncPromiseIds, visited) || nestedUpdate;
  },

  /** @param {DataProvider} dp */
  SYNC(dp, targetPromiseId, syncPromiseId, syncPromiseIds) {
    // TODO
  },

  // ###########################################################################
  // getPost*Data
  // ###########################################################################

  /** @param {DataProvider} dp */
  getPostAwaitData(dp, postEventUpdate) {
    const { util } = dp;
    const {
      // runId: postEventRunId,
      // realContextId,
      // contextId: postEventContextId,
      rootId: postEventRootId,
      schedulerTraceId,
      promiseId
    } = postEventUpdate;

    const preEventUpdate = util.getAsyncPreEventUpdateOfTrace(schedulerTraceId);

    if (!preEventUpdate) {
      // should never happen!
      dp.logger.warn(`[postAwait] "getAsyncPreEventUpdateOfTrace" failed:`, postEventUpdate);
      return null;
    }

    const {
      contextId: preEventContextId,
      // runId: preEventRunId,
      nestedPromiseId,
      rootId: preEventRootId
    } = preEventUpdate;

    const isFirstAwait = util.isFirstContextInParent(preEventContextId);

    /**
     * Implies that function was called by the system or some other caller that was not recorded
     */
    const isCallRecorded = !!promiseId;

    const s = [];
    let chainFromRootId = 0;
    const beforeRootId = postEventRootId;
    const toRootId = postEventRootId;

    // consider all CHAIN scenarios
    const rootIdUp = util.UP(promiseId, beforeRootId, s);
    const rootIdNested = nestedPromiseId && util.DOWN(nestedPromiseId, beforeRootId, s);

    if (!isFirstAwait || !isCallRecorded) {
      chainFromRootId = rootIdNested || preEventRootId;
      nestedPromiseId && util.SYNC(chainFromRootId, nestedPromiseId, beforeRootId, s);
    }
    else {
      if (rootIdUp && rootIdNested) {
        util.SYNC(rootIdUp, nestedPromiseId, beforeRootId, s);
      }
      chainFromRootId = rootIdNested || rootIdUp;
    }


    return {
      chainFromRootId,
      toRootId,
      // fromThreadId,
      // toThreadId,

      preEventUpdate,
      // preEventThreadId,
      rootIdUp,
      rootIdNested,
      isFirstAwait,
      isCallRecorded,
      s
    };

    // const previousPostUpdate = dp.util.getPreviousPostAsyncEventOfPromise(promiseId, preEventRootId);
    // const realContext = dp.collections.executionContexts.getById(realContextId);
    // const firstNestingUpdate = this.getFirstNestingAsyncUpdate(realContext.runId, promiseId);

    // const isNested = !!nestedPromiseId;
    // const isNestedChain = nestedPromiseId && util.isNestedChain(nestedPromiseId, schedulerTraceId);
    // const nestedUpdate = isNestedChain && util.getPreviousPostOrResolveAsyncEventOfPromise(nestedPromiseId, postEventRootId) || null;
    // const { rootId: nestedRootId = 0 } = nestedUpdate ?? EmptyObject;
    // const isChainedToRoot = isFirstAwait && dp.util.isPromiseChainedToRoot(preEventRunId, postEventContextId, promiseId);

    // return {
    //   preEventUpdate,
    //   isFirstAwait,
    //   isNested,
    //   // isNestedChain,
    //   nestedUpdate,
    //   nestedRootId,
    //   isChainedToRoot
    // };


    // const {
    //   preEventUpdate: {
    //     rootId: preEventRootId
    //   },
    //   isFirstAwait,
    //   // isNested,
    //   // isNestedChain,
    //   nestedRootId,
    //   isChainedToRoot
    // } = postUpdateData;

    // if (!isFirstAwait) {
    //   // Case 1: CHAIN
    //   if (nestedRootId) {
    //     // chain with nested root
    //     if (nestedThreadId === preEventThreadId) {
    //       fromRootId = nestedRootId;
    //       // NOTE: `fromThreadId` stays the same
    //       // TODO: if `fromThreadId` is different from `nestedThradId`, make this a sync instead
    //     }
    //   }
    //   toThreadId = fromThreadId;
    // }
    // else if (nestedRootId) {
    //   // Case 2: nested promise is chained into the same thread: CHAIN
    //   // CHAIN with nested promise: get `fromRootId` of latest `PostThen` or `PostAwait` (before this one) of promise.
    //   fromRootId = nestedRootId;
    //   fromThreadId = nestedThreadId;
    //   // TODO: if `fromThreadId` is different from `nestedThradId`, make this a sync instead
    //   toThreadId = fromThreadId;
    //   // }
    // }
    // else if (isCallNotRecorded || isChainedToRoot) {
    //   // Case 3: chained to root -> CHAIN
    //   toThreadId = fromThreadId;
    // }
    // else {
    //   // Case 4: first await and NOT chained to root and NOT nested -> FORK
    //   toThreadId = 0;
    // }

    // if (!isNestedChain && nestedRootId) {
    //   // nested, but not chained -> add SYNC edge
    //   this.addSyncEdge(nestedRootId, toRootId, AsyncEdgeType.SyncIn);
    // }
  },

  /** @param {DataProvider} dp */
  getPostThenData(dp, postEventUpdate) {
    const { util } = dp;
    const {
      // runId: postEventRunId,
      rootId: postEventRootId,
      // NOTE: the last active root is also the `context` of the `then` callback
      // contextId: thenCbContextId,
      schedulerTraceId,
      promiseId: postEventPromiseId,
      // nestedPromiseId
    } = postEventUpdate;

    const preEventUpdate = util.getAsyncPreEventUpdateOfTrace(schedulerTraceId);

    if (!preEventUpdate) {
      // should never happen!
      dp.logger.warn(`[postAwait] "getAsyncPreEventUpdateOfTrace" failed:`, postEventUpdate);
      return null;
    }

    const {
      // runId: preEventRunId,
      // rootId: preEventRootId,
      promiseId: preEventPromiseId,
    } = preEventUpdate;

    const s = [];
    const beforeRootId = postEventRootId;

    const rootIdDown = util.DOWN(preEventPromiseId, beforeRootId, s);
    const rootIdUp = util.UP(postEventPromiseId, beforeRootId, s);

    // TODO: add sync edges

    let chainFromRootId = rootIdDown || rootIdUp;
    const toRootId = postEventRootId;

    // const previousPostUpdate = util.getPreviousPostOrResolveAsyncEventOfPromise(preEventPromiseId, postEventRootId);
    // const isNested = !!nestedPromiseId;
    // const isChainedToRoot = util.isPromiseChainedToRoot(preEventRunId, thenCbContextId, postEventPromiseId);

    // const preEventThreadId = this.getOrAssignRootThreadId(preEventRootId, schedulerTraceId);

    // if (previousPostUpdate) { // NOTE: similar to `!isFirstAwait`
    //   // Case 1: pre-then promise has its own async updates (has already encountered PostAwait or PostThen)
    //   fromRootId = previousPostUpdate.rootId;
    //   fromThreadId = toThreadId = this.getOrAssignRootThreadId(fromRootId, schedulerTraceId);
    // }
    // else if (isChainedToRoot) {
    //   // Case 2: no previous Post update but chained to root -> CHAIN
    // }
    // // else if (isNestedChain) { // NOTE: this case is handled by the nested promise events
    // //   // CHAIN with nested promise: get `fromRootId` of latest `PostThen` or `PostAwait` (before this one) of promise.
    // // }
    // else {
    //   // Case 3: no previous Post update and NOT chained to root -> FORK
    //   toThreadId = 0;
    // }

    // if (!isNestedChain && nestedRootId) {
    //   // nested, but not chained -> add SYNC edge
    //   this.addSyncEdge(nestedRootId, toRootId, AsyncEdgeType.SyncIn);
    // }

    return {
      chainFromRootId,
      toRootId,

      preEventUpdate,
      rootIdUp,
      rootIdDown,
      // previousPostUpdate,
      // isNested,
      // isChainedToRoot
    };
  },

  /** @param {DataProvider} dp */
  getPostCallbackData(dp, postEventUpdate) {
    const { util } = dp;
    const {
      // runId: postEventRunId,
      rootId: postEventRootId,
      schedulerTraceId
    } = postEventUpdate;

    const preEventUpdate = util.getAsyncPreEventUpdateOfTrace(schedulerTraceId);

    if (!preEventUpdate) {
      // should never happen!
      dp.logger.warn(`[postAwait] "getAsyncPreEventUpdateOfTrace" could not find anything for schedulerTraceId=${schedulerTraceId}:`, postEventUpdate);
      return null;
    }

    const {
      rootId: preEventRootId,
      // isEventListener
    } = preEventUpdate;

    const isNested = false;
    let chainFromRootId;

    const beforeRootId = postEventRootId;

    // if (isEventListener) {
    // Case 1: event listener -> repeated calls of same trace
    const firstPostEventHandlerUpdate = util.getFirstAsyncPostEventUpdateOfTrace(schedulerTraceId);
    if (firstPostEventHandlerUpdate && firstPostEventHandlerUpdate.rootId < beforeRootId) {
      chainFromRootId = firstPostEventHandlerUpdate.rootId;
    }
    // }
    else if (preEventRootId === 1) {
      // Case 0: don't CHAIN cb from first root
      //      (TODO: top-level `await` would CHAIN from first root.)
    }
    else {
      const preEventUpdates = util.getAsyncPreEventUpdatesOfRoot(preEventRootId);
      if (preEventUpdates.length === 1) {
        // Case 2: this is the only pre-event in the pre-event's root -> CHAIN
        //    (meaning its the only async event scheduled from the same root)
        chainFromRootId = preEventRootId;
      }
      if (!chainFromRootId) {
        const thisStaticContextId = util.getContextStaticContext(postEventRootId);
        const lastStaticContextId = util.getContextStaticContext(preEventRootId);

        if (thisStaticContextId === lastStaticContextId) {
          // Case 3: recursive or repeating same function
          chainFromRootId = preEventRootId;
        }
      }
    }


    const toRootId = postEventRootId;

    return {
      chainFromRootId,
      toRootId,

      preEventUpdate,
      isNested,
      firstPostEventHandlerUpdate
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
  },

  /** @param {DataProvider} dp */
  getTraceOfAsyncNode(dp, asyncNodeId) {
    const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
    const firstTrace = dp.indexes.traces.byContext.getFirst(asyncNode.rootContextId);
    return firstTrace;
  },

  /** @param {DataProvider} dp */
  getAsyncParent(dp, asyncNodeId) {
    const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
    const parentEdge = dp.indexes.asyncEvents.to.getFirst(asyncNode.rootContextId);
    const parentRootContextId = parentEdge?.fromRootContextId;
    const parentAsyncNode = dp.indexes.asyncNodes.byRoot.getUnique(parentRootContextId);
    return parentAsyncNode;
  },
};
