import findLast from 'lodash/findLast';
import groupBy from 'lodash/groupBy';
import isNumber from 'lodash/isNumber';
import truncate from 'lodash/truncate';
import isPlainObject from 'lodash/isPlainObject';
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
import PromiseLinkType from '@dbux/common/src/types/constants/PromiseLinkType';
import { parseNodeModuleName } from '@dbux/common-node/src/util/pathUtil';
import AsyncEventUpdateType, { isPostEventUpdate, isPreEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import { AsyncUpdateBase, PreCallbackUpdate } from '@dbux/common/src/types/AsyncEventUpdate';
import { locToString } from './util/misc';
import { makeContextSchedulerLabel, makeTraceLabel } from './helpers/makeLabels';

/** @typedef {import('./RuntimeDataProvider').default} DataProvider */
/** @typedef {import('@dbux/common/src/types/ExecutionContext').default} ExecutionContext */

export class PostUpdateData {
  /**
   * @type {AsyncUpdateBase}
   */
  preEventUpdate;

  /**
   * @type {Array.<PromiseLink>}
   */
  links;

  /**
   * @type {Array.<number>}
   */
  syncPromiseIds;
}

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
    while (
      !dp.util.isRootContext(contextId) &&
      (parentContextId = executionContexts.getById(contextId).parentContextId)) {
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
        // 3. do 1. recursively to skip all deeper parent
        let fromAsyncEvent, fromContext = { contextId }, fromContextDepth;
        const depth = dp.util.getNestedDepth(contextId);
        do {
          fromAsyncEvent = dp.indexes.asyncEvents.to.getFirst(fromContext.contextId);
          fromContext = dp.collections.executionContexts.getById(fromAsyncEvent?.fromRootContextId);
          fromContextDepth = fromContext && dp.util.getNestedDepth(fromContext.contextId);
        } while (fromContext && (depth < fromContextDepth));
        return fromContext;
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
   * @see https://github.com/Domiii/dbux/issues/561
   * @param {DataProvider} dp
   */
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
      ({ refId: _refId, value: _value } = dataNode);
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
   * @return {[number, number, number][]} childNodeId, childRefId, childValue
   */
  getDataNodeArrayChildren(dp, refId) {
    const valueRef = dp.collections.values.getById(refId);
    const { category } = valueRef;
    if (isPlainObject(valueRef.value) && ValueTypeCategory.is.Array(category)) {
      return Object.values(valueRef.value);
    }
    return null;
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
    if (!isPlainObject(valueRef.value)) {
      return null;
    }
    if (ValueTypeCategory.is.Array(category)) {
      entries = dp.util.getDataNodeArrayChildren(refId);
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
    const terminateNode = terminateNodeId && dp.util.getDataNode(terminateNodeId);
    const terminateTraceId = terminateNode?.traceId;
    for (const modifyNode of modifyNodes) {
      if (modifyNode.nodeId > terminateNodeId && modifyNode.traceId > terminateTraceId) {
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
      const entries = dp.util.constructValueObjectShallow(refId, nodeId);
      const valueRef = dp.collections.values.getById(refId);
      if (!entries) {
        // node was omitted or did not have children for other reasons
        // default
        valueString = valueRef.value?.toString?.() || String(valueRef.value);
      }
      else {
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
          // default
          valueString = valueRef.value?.toString?.() || String(valueRef.value);
        }
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
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    if (dataNode) {
      return dp.util.getDataNodeValueString(dataNode.nodeId);
    }
    return '(no value or undefined)';
  },

  /** @param {DataProvider} dp */
  getTraceValueStringShort(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    if (dataNode) {
      return dp.util.getDataNodeValueStringShort(dataNode.nodeId);
    }
    return '(no value or undefined)';
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
   * TODO: given the `dataNode` of (what should be) an array, return its element DataNodes.
   * 
   * @param {DataProvider} dp
   */
  getArrayDataNodes(dp, dataNode) {
    if (!dataNode) {
      return EmptyArray;
    }
    const children = dp.util.constructValueObjectShallow(dataNode.refId, dataNode.nodeId);
    if (!Array.isArray(children)) {
      return EmptyArray;
    }

    return children.map(([childNodeId/* , childRefId, childValue */]) => dp.util.getDataNode(childNodeId));
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
          // NOTE: first argument to `bind` is `thisArg` -> don't map to parameter
          ...(boundArgNodes?.slice(1) || EmptyArray),
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
      parentContextId &&
      (parentContext = dp.collections.executionContexts.getById(parentContextId)) &&
      isRealContextType(parentContext.contextType)
    ) {
      return parentContextId;
    }
    else {
      // if (parentContextId && !dp.collections.executionContexts.getById(parentContextId))

      // eslint-disable-next-line max-len
      dp.logger.trace(`Could not find realContext for contextId=${contextId}, parentContextId=${parentContextId}, parentContext=`, dp.collections.executionContexts.getById(parentContextId));
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
  getChainTo(dp, toRootId) {
    const fromEdges = dp.indexes.asyncEvents.to.get(toRootId);
    return fromEdges?.filter(edge => edge.edgeType === AsyncEdgeType.Chain) || EmptyArray;
  },

  /** @param {DataProvider} dp */
  getAsyncEdgeFromTo(dp, fromRootId, toRootId) {
    const toEdges = dp.indexes.asyncEvents.to.get(toRootId);
    return toEdges?.find(edge => edge.fromRootContextId === fromRootId) || null;
  },

  /**
   * @param {DataProvider} dp
   * @return {AsyncEventUpdate}
   */
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
  getPromiseCreationRoot(dp, promiseId) {
    const firstTraceOfPromise = dp.util.getFirstTraceByRefId(promiseId);
    return dp.collections.executionContexts.getById(firstTraceOfPromise.rootContextId);
  },

  /** 
   * Two possible scenarios for updates with `nestedPromiseId`:
   * 1. PreAwait or
   * 2. PostThen
   * 
   * @param {DataProvider} dp
   */
  getFirstUpdateOfNestedPromise(dp, nestedPromiseId) {
    const updates = dp.indexes.asyncEventUpdates.byNestedPromise.get(nestedPromiseId);
    return updates?.[0];
  },

  /** @param {DataProvider} dp */
  getFirstPreThenUpdateOfPromise(dp, promiseId) {
    const updates = dp.indexes.asyncEventUpdates.byPromise.get(promiseId);
    return updates?.find(upd => AsyncEventUpdateType.is.PreThen(upd.type)) || null;
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

  /**
   * NOTE: Any Post* update should be unique to its root.
   */
  getAsyncPostEventUpdateOfRoot(dp, rootId) {
    const updates = dp.indexes.asyncEventUpdates.byRoot.get(rootId);
    return updates?.find(upd => isPostEventUpdate(upd.type)) || null;
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

  // /**
  //  * Get the last "Post" asyncEvent (also an "edge trigger event") of a given promise.
  //  * That update must have `rootId` < `beforeRootId`.
  //  * Recurse if nested.
  //  *
  //  * @deprecated
  //  * @param {DataProvider} dp
  //  * @return {AsyncEventUpdate}
  //  */
  // getPreviousPostOrResolveAsyncEventOfPromise(dp, promiseId, beforeRootId, _visited = new Set()) {
  //   if (_visited.has(promiseId)) {
  //     // TODO: observe this. can happen if a promise returns itself etc.
  //     dp.logger.trace(`[getPreviousPostOrResolveAsyncEventOfPromise] circular promiseId: ${promiseId} (visited=[${Array.from(_visited).join(', ')}])`);
  //     return null;
  //   }
  //   _visited.add(promiseId);
  //   // TODO: prefer pre-chained event (post event that was first scheduled, rather than last executed)
  //   let postUpdate = dp.util.getLastAsyncPostEventUpdateOfPromise(promiseId, beforeRootId);
  //   let nestedPromiseId;

  //   // recurse on nested promises:
  //   if (postUpdate && AsyncEventUpdateType.is.PostThen(postUpdate.type)) {
  //     if (postUpdate.nestedPromiseId) {
  //       // Case 1: promise returned a nested promise from `then` callback -> go down the tree
  //       nestedPromiseId = postUpdate.nestedPromiseId;
  //     }
  //   }
  //   else {
  //     // (maybe) Case 2: returned promise from `async` function
  //     // NOTE: we are making sure, this is the "returning" postUpdate
  //     let resumeContextId;
  //     if (postUpdate && AsyncEventUpdateType.is.PostAwait(postUpdate.type)) {
  //       // async function has at least one `await`
  //       resumeContextId = postUpdate.contextId;
  //     }
  //     else {
  //       // async function had no `await`: find call trace -> called context
  //       const asyncCallResultTrace = dp.util.getFirstTraceByRefId(promiseId);
  //       const callId = asyncCallResultTrace && dp.util.getCallIdOfTrace(asyncCallResultTrace.traceId);
  //       const resumeContext = callId && dp.util.getCalledContext(callId);
  //       resumeContextId = resumeContext?.contextId;
  //     }

  //     if (resumeContextId) {
  //       const returnValueRef = dp.util.getReturnValueRefOfContext(resumeContextId);
  //       // const returnValueRef = dp.util.getReturnValueRefOfInterruptableContext(resumeContextId);
  //       if (returnValueRef?.isThenable) {
  //         // getPromiseId
  //         nestedPromiseId = returnValueRef.refId;
  //       }
  //     }
  //   }
  //   postUpdate = nestedPromiseId &&
  //     dp.util.getPreviousPostOrResolveAsyncEventOfPromise(nestedPromiseId, beforeRootId, _visited) ||
  //     postUpdate;

  //   return postUpdate;
  // },

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

  /**
   * @param {DataProvider} dp
   */
  getNestingAsyncCallStack(dp, rootId) {
    let u, promiseId;
    const stack = [];
    const visited = new Set();
    while ((u = dp.util.getAsyncPostEventUpdateOfRoot(rootId))) {
      ({ promiseId } = u);
      const nestingUpdate = dp.util.getFirstUpdateOfNestedPromise(promiseId);
      rootId = nestingUpdate?.rootId;
      stack.push({ promiseId, rootId });
      // if (nestingUpdate && !visited...) {
      //   // TODO: visit links
      // }
    }
    return stack;
  },

  /** @param {DataProvider} dp */
  isAsyncNodeTerminalNode(dp, asyncNodeId) {
    const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
    const preEventUpdates = dp.util.getAsyncPreEventUpdatesOfRoot(asyncNode.rootContextId);
    return !preEventUpdates.length;
  },

  /** 
   * @param {DataProvider} dp
   * @return {Set<ExecutionContext>}
   */
  getAllSyncRoots(dp, rootId) {
    const { syncPromiseIds } = dp.util.getAsyncNode(rootId);
    const allSyncRoots = syncPromiseIds?.flatMap(promiseId => {
      let roots = [];
      const creationRoot = dp.util.getPromiseCreationRoot(promiseId);
      const postUpdateData = { links: [], syncPromiseIds: [] }; // ignore for now
      const downRoots = dp.util.DOWN(promiseId, Infinity, creationRoot.contextId, postUpdateData);
      /* handle: `dp.util.DOWN` either returns 0, a rootId or maybe an array (in case of Promise.all) */
      if (Array.isArray(downRoots)) {
        roots = downRoots;
      }
      else if (downRoots) {
        roots.push(downRoots);
      }

      // handle special Promisify synchronization -> test w/ new producer_consumer_async
      for (const p of postUpdateData.syncPromiseIds) {
        const link = dp.indexes.promiseLinks.to.getUnique(p);
        if (link && link.type === PromiseLinkType.Promisify && !roots.includes(link.rootId)) {
          roots.push(link.rootId);
        }
      }

      return roots.flatMap(_rootId => {
        const result = [];
        let fromAsyncEvent, contextId = _rootId, context;
        do {
          context = dp.collections.executionContexts.getById(contextId);
          result.push(context);
          fromAsyncEvent = dp.indexes.asyncEvents.to.getFirst(contextId);
          contextId = dp.collections.executionContexts.getById(fromAsyncEvent?.fromRootContextId)?.contextId;
        } while (contextId && contextId > creationRoot.contextId);
        return result;
      }
      );
    });

    return new Set(allSyncRoots);
  },

  /** ###########################################################################
   * new async promise linkage
   *  #########################################################################*/

  /** @param {DataProvider} dp */
  getPromiseRootId(dp, promiseId) {
    const traceId = dp.util.getFirstTraceIdByRefId(promiseId);
    return traceId && dp.util.getRootContextOfTrace(traceId)?.contextId || 0;
  },

  /** 
   * Find rootId of last Post* update of top-most promise that nests promise of given `promiseId`.
   * The result is:
   *    * either a root-level `await q*`'s PreAwait update
   *    * or the PostUpdate of a nesting promise `q3` [nesting q2 (never q1); “Nested PostThen” or “AsyncReturn”]
   * 
   * NOTE: UP only returns one matching root. Multiple matches for CHAIN are not possible, because:
   *    (1) the promise must be created in the same root as the nester (else its SYNC).
   *    (2) and that root is the only possible candidate for chaining.
   * 
   * @param {DataProvider} dp
   */
  UP(dp, nestedPromiseId, beforeRootId, nestingUpdates) {
    // -- 4 caller cases (CC), operating on `q* = nestedPromise` --
    // CC1: PostAwait: `q1 = f()` (firstAwait inside f) [always new]
    // CC2: PostThen: `q2 = p.then(h)` (PostUpdate inside h) [always old]
    // CC3: an outer linked promise `q3`, nesting either `q1`, `q2` or `q4`
    // CC4: a chained promise `q4 = q.then(i)` [has not settled yet]

    // NOTE: None of the promises q* have settled yet (since `q` only now settled).

    let u;

    const nestingLink = dp.indexes.promiseLinks.from.getFirst(nestedPromiseId);
    if (nestingLink) {
      // “Nested PostThen” or “AsyncReturn” or “resolve” or “all”
      const { to: outerPromiseId/* , rootId */ } = nestingLink;
      if ((u = dp.util.getLastAsyncPostEventUpdateOfPromise(outerPromiseId, beforeRootId))) {
        // “Nested PostThen” or “AsyncReturn” (of function with `PostAwait`, i.e. `await` executed)
        // nestingUpdates.push({ updateId: u.updateId, linkId: nestingLink.linkId });
        nestingUpdates.push(u.updateId);
        return u.rootId;
      }
      // “resolve” or “all” or “AsyncReturn” (of function where no `await` executed)
      // nestingUpdates.push({ linkId: nestingLink.linkId });
      return dp.util.UP(outerPromiseId, beforeRootId, nestingUpdates);
    }
    else if ((u = dp.util.getFirstUpdateOfNestedPromise(nestedPromiseId)) && u.rootId < beforeRootId) {
      // u is PreAwait && PostAwait has not happened yet: `await nestedPromise`
      // NOTE: This is guaranteed to be PreAwait, not PreThen
      //    -> because "Nested PostThen" has a `nestingLink`, and thus would go down previous branch
      const promiseRootId = dp.util.getPromiseRootId(nestedPromiseId);
      if (promiseRootId < u.rootId) {
        // NOTE: this implies `await q2` (because `q1` is always new).
        // NOTE: SYNC edge will be added in u's own Post* event handler
        return 0;
      }
      else {
        nestingUpdates.push(u.updateId);
        // implies: promiseRootId === u.rootId.
        // implies: `await q*` where `q*` was created in PreAwait rootId.
        // NOTE: promiseRootId > u.rootId is impossible because if `u` nests `p`, `u` cannot occur before `p`

        // const isFirstAwait = dp.util.isFirstContextInParent(u.contextId);
        if (/* !isFirstAwait || */ u.contextId === u.rootId) {
          return u.rootId;  // already at root (can't go up any further)
        }
        return u.promiseId && dp.util.UP(u.promiseId, beforeRootId, nestingUpdates) || 0;
      }
    }
    else if ((u = dp.util.getFirstPreThenUpdateOfPromise(nestedPromiseId)) &&
      u.rootId < beforeRootId
    ) {
      // promise is not nested but was THEN’ed -> follow down the THEN chain (until we find a promise that is nested)
      return dp.util.UP(u.postEventPromiseId, beforeRootId, nestingUpdates);
    }

    // -> nestedPromiseId is nested but there is no relevant Post event to CHAIN from, return 0
    return 0;
  },

  /** 
   * NOTE: The algorithm is shared with `util.UP`, but with different teminate condition
   * @param {DataProvider} dp
   */
  getNestedAncestorsOfPromise(dp, nestedPromiseId, beforeRootId, nestingTraces) {
    let u;
    const nestingLink = dp.indexes.promiseLinks.from.getFirst(nestedPromiseId);
    if (nestingLink) {
      const { to: outerPromiseId } = nestingLink;
      if ((u = dp.util.getLastAsyncPostEventUpdateOfPromise(outerPromiseId, beforeRootId))) {
        nestingTraces.push(u.schedulerTraceId);
        // return u.rootId;
      }
      return dp.util.getNestedAncestorsOfPromise(outerPromiseId, beforeRootId, nestingTraces);
    }
    else if ((u = dp.util.getFirstUpdateOfNestedPromise(nestedPromiseId)) && u.rootId < beforeRootId) {
      const promiseRootId = dp.util.getPromiseRootId(nestedPromiseId);
      if (promiseRootId < u.rootId) {
        return nestedPromiseId;
      }
      else {
        nestingTraces.push(u.schedulerTraceId);
        // if (/* !isFirstAwait || */ u.contextId === u.rootId) {
        //   return u.rootId;
        // }
        return dp.util.getNestedAncestorsOfPromise(u.promiseId, beforeRootId, nestingTraces);
      }
    }
    else if ((u = dp.util.getFirstPreThenUpdateOfPromise(nestedPromiseId)) &&
      AsyncEventUpdateType.is.PreThen(u.type) &&
      u.rootId < beforeRootId
    ) {
      return dp.util.getNestedAncestorsOfPromise(u.postEventPromiseId, beforeRootId, nestingTraces);
    }
    return nestedPromiseId;
  },

  /** @param {DataProvider} dp */
  getNestedAncestors(dp, rootId) {
    const asyncNode = dp.util.getAsyncNode(rootId);
    if (!asyncNode._nestedAncestors) {
      asyncNode._nestedAncestors = dp.util._getNestedAncestors(rootId);
    }
    return asyncNode._nestedAncestors;
  },

  /** 
   * TODO: [performance] cache this recursive result
   * NOTE: Wrapper of `util.getNestedAncestorsOfPromise` for context version
   * @param {DataProvider} dp
   */
  _getNestedAncestors(dp, rootId, nestingTraces = []) {
    const u = dp.util.getAsyncPostEventUpdateOfRoot(rootId);
    if (!u) {
      return nestingTraces;
    }

    let nextPromiseId = u.promiseId, nextRootId, nextTraceId;
    if (nextPromiseId) {
      nextPromiseId = dp.util.getNestedAncestorsOfPromise(nextPromiseId, rootId, nestingTraces);
      const nextTrace = dp.util.getFirstTraceByRefId(nextPromiseId);
      nextTraceId = nextTrace?.traceId;
      nextRootId = nextTrace?.rootContextId;
    }
    else {
      const fromEdge = dp.indexes.asyncEvents.to.getUnique(u.rootId);
      nextTraceId = u.schedulerTraceId;
      nextRootId = fromEdge?.fromRootContextId;
    }

    if (nextTraceId) {
      nestingTraces.push(nextTraceId);
    }

    if (nextRootId) {
      dp.util._getNestedAncestors(nextRootId, nestingTraces);
    }

    return nestingTraces;
  },

  /** 
   * @param {DataProvider} dp
   */
  getNestedDepth(dp, rootId) {
    return dp.util.getNestedAncestors(rootId).length;
  },

  /** ###########################################################################
   * DOWN
   * ##########################################################################*/

  /** 
   * `getNestedPromiseUpdate`.
   * Returns the inner most nested promise that has a Post* update, nested by `toPromiseId`.
   * NOTE: `nestingPromiseId` is already settled.
   * 
   * @param {DataProvider} dp
   * @param {PostUpdateData} postUpdateData
   */
  GNPU(dp, nestingPromiseId, beforeRootId, syncBeforeRootId, postUpdateData, depth = 0, visited = new Set()) {
    if (visited.has(nestingPromiseId)) {
      return null;
    }
    visited.add(nestingPromiseId);
    const { links, syncPromiseIds } = postUpdateData;

    const promiseRootId = dp.util.getPromiseRootId(nestingPromiseId);
    let nestedUpdate = dp.util.getLastAsyncPostEventUpdateOfPromise(nestingPromiseId, beforeRootId);

    // SYNC if: (i) promise was created in a root BEFORE the NESTING happened, or
    //          (ii) someone else already CHAINED against it.
    if (promiseRootId < syncBeforeRootId) {
      // potentially nested for synchronization -> do not go deeper
      // const chainFrom = dp.util.getChainFrom(nestedUpdate.rootId); // store for debugging
      syncPromiseIds.push(nestingPromiseId);
      // log(`SYNC`, postUpdateData, nestingPromiseId);
      return null;
    }
    else {
      // Cases for nesting:

      //    -> nestedUpdate (u) can be {PostAwait,PostThen,PostCallback}
      //    -> nestedLink (link) can be {AsyncReturn,ThenNested,Resolve,All,Promisify}

      // Case 1:  p nests shallow link     -> !u && link (Resolve,All)
      // Case 2a: p nests u (PostAwait)    -> u && !link
      // Case 2b: p nests u (PostAwait)    -> u && link (AsyncReturn) [can be BOTH]
      // Case 3a: p nests u (PostThen)     -> u && !link
      // Case 3b: p nests u (PostThen)     -> u && link (ThenNested) [can be BOTH]
      // Case 4a: p nests u (PostCallback) -> u && !link 
      // Case 4a: p nests u (PostCallback) -> u && link (Promisify) [can only be either SYNC or CHAIN]

      const nestedLink = dp.indexes.promiseLinks.to.getUnique(nestingPromiseId);
      if (nestedLink) {
        // -> go deep on nested link
        links.push(nestedLink);

        syncBeforeRootId = nestedUpdate?.rootId || syncBeforeRootId;

        // try to go deeper
        if (Array.isArray(nestedLink.from)) {
          // multi CHAIN
          const nestedUpdates = nestedLink.from.flatMap(nestedPromiseId =>
            dp.util.GNPU(nestedPromiseId, beforeRootId, syncBeforeRootId, postUpdateData, depth + 1, visited)
          ).filter(u => !!u);
          if (nestedUpdates.length) {
            nestedUpdate = nestedUpdates;
          }
        }
        else if (nestedLink.from) {
          // single CHAIN
          nestedUpdate = dp.util.GNPU(nestedLink.from, beforeRootId, syncBeforeRootId, postUpdateData, depth + 1, visited) || nestedUpdate;
        }
        else if (nestedLink.asyncPromisifyPromiseId) {
          //   // promisify linkage, encountering `p` in `C()` in:
          //   //  `A(); p.then(() => (B(), p)).then(C)`
          //   // NOTE: nestedLink is created when `resolve`/`reject` is called
          //   if (nestedLink.rootId) {
          //     // -> the link's root is the actual nested root
          //     if (promiseRootId < /*nestedLink.rootId*/ postUpdateData.preEventUpdate.rootId) {
          //       // resolve function was called 
          //       // see `sync-promisify*` samples
          //       // UNNECESARY: already caught above
          //       syncPromiseIds.push(nestingPromiseId);
          //     }
          //     else {
          //       // no nesting possible -> stop recursion here
          //       // UNNECESARY since getAsyncPostEventUpdateOfRoot(nestedLink.rootId) ===== nestedUpdate.
          //       nestedUpdate = dp.util.getAsyncPostEventUpdateOfRoot(nestedLink.rootId) || nestedUpdate;
          //     }
          //   }
        }
        else {
          warn(`invalid PromiseLink for nestingPromiseId=${nestingPromiseId} has no 'from' nor 'asyncPromisifyPromiseId':`, nestedLink);
        }
      }
      if (!nestedUpdate) {
        // no nested update found -> go to previous promise and repeat
        // maybe the given promise did not have a recorded Post* update, but it's predecessor might have
        // -> could be because 
        //    (i) the update happened inside an untraced module, or 
        //    (ii) a reject/throw skipped it
        // const u = dp.util.getAsyncPreEventUpdateOfPromise(nestingPromiseId, beforeRootId);
        const u = dp.indexes.asyncEventUpdates.preUpdatesByPostEventPromise.getUnique(nestingPromiseId);
        if (u) {
          if (AsyncEventUpdateType.is.PreThen(u.type)) {
            // go to previous promise in promise tree
            const preThenPromiseId = u.promiseId;
            nestedUpdate = dp.util.GNPU(preThenPromiseId, beforeRootId, syncBeforeRootId, postUpdateData, 1, visited);
          }
          else if (AsyncEventUpdateType.is.PreAwait(u.type)) {
            // NOTE: this should never happen, since a `PostAwait` can never be "swallowed"
            logError(`Unexpected PreAwait in DOWN: ${nestingPromiseId} -> ${u.nestedPromiseId} (${u.rootId})`);
            // return dp.util.GNPU(u.nestedPromiseId, beforeRootId, syncBeforeRootId, postUpdateData, 1, visited);
          }
        }

        if (!nestedUpdate && nestedLink?.asyncPromisifyPromiseId) {
          // Promise ctor's resolve was called while this AE was waiting for it.
          //    Also, there was no nestedUpdate, meaning resolve was called 
          //      outside of a promisified callback.
          //    -> means it was called by a root outside this AE's own thread.
          syncPromiseIds.push(nestingPromiseId);
          return null;
        }
      }
      return nestedUpdate;
    }
  },

  WrapDownResult(dp, nestedUpdate, postUpdateData) {
    // if (nestedUpdate && dp.util.getChainFrom(nestedUpdate.rootId).length) {
    //   nestedUpdate.promiseId && postUpdateData.syncPromiseIds.push(nestedUpdate.promiseId);
    //   return null;
    // }
    return nestedUpdate?.rootId || 0;
  },

  /** @param {DataProvider} dp */
  DOWN(dp, promiseId, beforeRootId, syncBeforeRootId, postUpdateData, depth = 0) {
    const visited = new Set();
    // const result = dp.util._DOWN(promiseId, beforeRootId, syncBeforeRootId, postUpdateData, depth) || 0;
    const nestedUpdate = dp.util.GNPU(promiseId, beforeRootId, syncBeforeRootId, postUpdateData, depth, visited);
    if (Array.isArray(nestedUpdate)) {
      return nestedUpdate.map(u => dp.util.WrapDownResult(u, postUpdateData));
    }
    else {
      return dp.util.WrapDownResult(nestedUpdate, postUpdateData);
    }
  },

  // /**
  //  * NOTE: promiseId is ensured to be settled because promiseId is settled
  //  * 
  //  * @param {DataProvider} dp
  //  * @param {PostUpdateData} postUpdateData
  //  */
  // _DOWN(dp, promiseId, beforeRootId, syncBeforeRootId, postUpdateData, depth, visited = new Set()) {
  //   if (!nestedUpdate) {
  //     return null;
  //   }

  //   // if (Array.isArray(nestedUpdate)) {
  //   //   const nestedUpdateArr = nestedUpdate.flatMap(u =>
  //   //     dp.util._DOWN(u.promiseId, beforeRootId, syncPromiseIds, visited)
  //   //   ).filter(u => !!u);
  //   //   if (nestedUpdateArr.length) {
  //   //     nestedUpdate = nestedUpdateArr;
  //   //   }
  //   // }
  //   // else {
  //   //   nestedUpdate = dp.util._DOWN(nestedUpdate.promiseId, beforeRootId, syncPromiseIds, visited) || nestedUpdate;
  //   // }
  //   return nestedUpdate;
  // },

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
    const toRootId = postEventRootId;

    const links = [];
    const syncPromiseIds = [];
    const nestingUpdates = [];
    const postUpdateData = {
      toRootId,
      preEventUpdate,
      links,
      syncPromiseIds,
      nestingUpdates,

      // preEventThreadId,
      isFirstAwait,
      isCallRecorded,
    };

    let chainFromRootId = 0;
    const beforeRootId = postEventRootId;

    // Case 1a: CHAIN via async function's own promise (in case of firstAwait)
    const rootIdUp = isFirstAwait && util.UP(promiseId, beforeRootId, nestingUpdates);

    // Case 1b: CHAIN to "previous await root" (NOTE: that root will always come *after* any of its own nested updates)
    const rootIdPrevious = !isFirstAwait && preEventRootId;

    // Case 2: nested
    const syncBeforeRootId = preEventRootId;
    const rootIdNested = nestedPromiseId && util.DOWN(nestedPromiseId, beforeRootId, syncBeforeRootId, postUpdateData);

    if (rootIdNested) {
      chainFromRootId = rootIdNested;
    }
    else if (!isFirstAwait || !isCallRecorded) {
      chainFromRootId = rootIdPrevious;
    }
    else {
      chainFromRootId = rootIdUp;
    }

    // // let chainFromThreadId, nestedThreadId;
    // if (rootIdNested) {
    //   // if (chainFromRootId && (chainFromThreadId = util.getAsyncRootThreadId(chainFromRootId)) &&
    //   //   (nestedThreadId = util.getAsyncRootThreadId(rootIdNested) && chainFromThreadId === nestedThreadId)) {
    //   // Nested is also on PreEventThreadId -> CHAIN against nested (assured by `DOWN`)
    //   chainFromRootId = rootIdNested;
    //   // }
    //   // else {
    //   //   // different threads -> SYNC
    //   //   // util.SYNC(chainFromRootId, nestedPromiseId, beforeRootId, syncPromiseIds);
    //   // }
    // }

    postUpdateData.chainFromRootId = chainFromRootId;

    postUpdateData.rootIdUp = rootIdUp;
    postUpdateData.rootIdNested = rootIdNested;
    // postUpdateData.chainFromThreadId = chainFromThreadId;
    // postUpdateData.nestedThreadId = nestedThreadId;

    return postUpdateData;
  },

  /** 
   * @param {DataProvider} dp
   * @return {PostUpdateData}
   */
  getPostThenData(dp, postEventUpdate) {
    const { util } = dp;
    const {
      // runId: postEventRunId,
      rootId: postEventRootId,
      // NOTE: the last active root is also the `context` of the `then` callback
      // contextId: thenCbContextId,
      schedulerTraceId,
      promiseId: postEventPromiseId,
    } = postEventUpdate;

    const preEventUpdate = util.getAsyncPreEventUpdateOfTrace(schedulerTraceId);

    if (!preEventUpdate) {
      // should never happen!
      dp.logger.warn(`[postAwait] "getAsyncPreEventUpdateOfTrace" failed:`, postEventUpdate);
      return null;
    }

    const toRootId = postEventRootId;

    const links = [];
    const syncPromiseIds = [];
    const nestingUpdates = [];
    const postUpdateData = {
      toRootId,
      preEventUpdate,
      links,
      syncPromiseIds,
      nestingUpdates
    };

    const {
      // runId: preEventRunId,
      rootId: preEventRootId,
      promiseId: preEventPromiseId,
    } = preEventUpdate;

    const beforeRootId = postEventRootId;

    const syncBeforeRootId = preEventRootId;
    const rootIdDown = util.DOWN(preEventPromiseId, beforeRootId, syncBeforeRootId, postUpdateData);
    const rootIdUp = util.UP(postEventPromiseId, beforeRootId, nestingUpdates);

    let chainFromRootId = rootIdDown || rootIdUp;

    postUpdateData.chainFromRootId = chainFromRootId;
    postUpdateData.rootIdUp = rootIdUp;
    postUpdateData.rootIdDown = rootIdDown;

    // /**
    //  * NOTE: `rootIdNested` is (generally) not available at this point, since the nested promise might not have done work yet.
    //  * In case of nesting, the edge is established via nestedPromise's `rootIdUp`.
    //  */
    // rootIdNested,
    return postUpdateData;
  },

  /**
   * @param {DataProvider} dp
   * @return {PostUpdateData}
   */
  getPostCallbackData(dp, postEventUpdate) {
    const { util } = dp;
    const {
      // runId: postEventRunId,
      rootId: postEventRootId,
      schedulerTraceId
    } = postEventUpdate;

    /**
     * @type {PreCallbackUpdate}
     */
    const preEventUpdate = util.getAsyncPreEventUpdateOfTrace(schedulerTraceId);

    if (!preEventUpdate) {
      // should never happen!
      dp.logger.warn(`[postAwait] "getAsyncPreEventUpdateOfTrace" could not find anything for schedulerTraceId=${schedulerTraceId}:`, postEventUpdate);
      return null;
    }

    const {
      rootId: preEventRootId,
      // isEventListener
      promiseId: preEventPromiseId
    } = preEventUpdate;

    const isNested = false;
    const beforeRootId = postEventRootId;

    let chainToPromiseId, chainFromRootId, rootIdDown, rootIdUp;

    // the PostEventUpdate of preEventUpdate
    const postPreEventUpdate = util.getAsyncPostEventUpdateOfRoot(preEventRootId);
    const firstPostEventHandlerUpdate = util.getFirstAsyncPostEventUpdateOfTrace(schedulerTraceId);

    let promisePostUpdateData;

    // if (preEventRootId === 1) {
    //   // Case 1: don't CHAIN cb from first root
    //   //      (TODO: top-level `await` would CHAIN from first root.)
    // }
    // else 
    const syncPromiseIds = [];
    const nestingUpdates = [];
    if (preEventPromiseId/*  || postPreEventUpdate?.promiseId */) {
      // Case 1: Promisification
      chainToPromiseId = preEventPromiseId || postPreEventUpdate.promiseId;
      const toRootId = postEventRootId;

      const links = [];
      promisePostUpdateData = {
        toRootId,
        preEventUpdate,
        links,
        syncPromiseIds,
        nestingUpdates
      };
      const syncBeforeRootId = preEventRootId;
      rootIdDown = postPreEventUpdate?.promiseId &&
        util.DOWN(postPreEventUpdate?.promiseId, beforeRootId, syncBeforeRootId, promisePostUpdateData) || 0;
      rootIdUp = util.UP(chainToPromiseId, beforeRootId, nestingUpdates);

      nestingUpdates.push(preEventUpdate.updateId); // PostCallback always adds its own scheduler as a nesting level

      // go up the promise chain
      chainFromRootId = rootIdDown || rootIdUp;
    }
    else {
      // Case 2: heuristics
      if (firstPostEventHandlerUpdate && firstPostEventHandlerUpdate.rootId < beforeRootId) {
        // Heuristic 1: event listener -> repeated calls of same scheduler trace
        chainFromRootId = firstPostEventHandlerUpdate.rootId;
      }
      else {
        // const preEventUpdates = util.getAsyncPreEventUpdatesOfRoot(preEventRootId);
        // if (preEventUpdates.length === 1) {
        //   // Heuristic 2: this is the only pre-event in the pre-event's root -> CHAIN
        //   //    (meaning its the only Pre async event scheduled from the same root)
        //   chainFromRootId = preEventRootId;
        // }
        // else {
        const thisStaticContextId = util.getContextStaticContext(postEventRootId);
        const lastStaticContextId = util.getContextStaticContext(preEventRootId);

        if (thisStaticContextId === lastStaticContextId) {
          // Heuristic 2: recursive or repeating same function
          chainFromRootId = preEventRootId;
        }
        // }
      }
    }


    const toRootId = postEventRootId;

    return {
      chainFromRootId,
      toRootId,
      chainToPromiseId,
      preEventUpdate,

      isNested,
      firstPostEventHandlerUpdate,

      rootIdDown,
      rootIdUp,
      syncPromiseIds,
      nestingUpdates
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
