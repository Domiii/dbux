import { format } from 'util';
import stripAnsi from 'strip-ansi';
import isString from 'lodash/isString';
import findLast from 'lodash/findLast';
import groupBy from 'lodash/groupBy';
import isNumber from 'lodash/isNumber';
import truncate from 'lodash/truncate';
import last from 'lodash/last';
import sum from 'lodash/sum';
import clone from 'lodash/clone';
import TraceType, { hasDynamicTypes, isTracePop, isBeforeCallExpression } from '@dbux/common/src/types/constants/TraceType';
import SpecialIdentifierType from '@dbux/common/src/types/constants/SpecialIdentifierType';
import { pushArrayOfArray } from '@dbux/common/src/util/arrayUtil';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { typedShallowClone } from '@dbux/common/src/util/typedClone';
import { newLogger } from '@dbux/common/src/log/logger';
import { renderValueSimple } from '@dbux/common/src/util/stringUtil';
import { renderPath } from '@dbux/common-node/src/util/pathUtil';
import { parsePackageName } from '@dbux/common-node/src/util/moduleUtil';
import DataNodeType, { isDataNodeModifyType, isDataNodeWrite } from '@dbux/common/src/types/constants/DataNodeType';
import StaticTrace from '@dbux/common/src/types/StaticTrace';
import StaticContextType, { isVirtualStaticContextType } from '@dbux/common/src/types/constants/StaticContextType';
import ExecutionContextType, { isRealContextType } from '@dbux/common/src/types/constants/ExecutionContextType';
import { isCallResult, hasCallId } from '@dbux/common/src/types/constants/traceCategorization';
// eslint-disable-next-line max-len
import ValueTypeCategory, { isObjectCategory, isPlainObjectOrArrayCategory, isFunctionCategory, getSimpleTypeString, ValuePruneState, isPruneStateOk } from '@dbux/common/src/types/constants/ValueTypeCategory';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import SpecialCallType from '@dbux/common/src/types/constants/SpecialCallType';
import PromiseLinkType from '@dbux/common/src/types/constants/PromiseLinkType';
import AsyncEventUpdateType, { isPostEventUpdate, isPreEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import AsyncEventType, { getAsyncEventTypeOfAsyncEventUpdateType } from '@dbux/common/src/types/constants/AsyncEventType';
import { isTraceControlRolePop, isTraceControlRoleDecision } from '@dbux/common/src/types/constants/TraceControlRole';
import RefSnapshot, { RefSnapshotTreeNode, VersionedRefSnapshot } from '@dbux/common/src/types/RefSnapshot';
import { AsyncUpdateBase, PreCallbackUpdate } from '@dbux/common/src/types/AsyncEventUpdate';
import { locToString } from './util/misc';
import { makeContextSchedulerLabel, makeTraceLabel } from './helpers/makeLabels';

/** @typedef {import('./RuntimeDataProvider').default} RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */
/** @typedef {import('@dbux/common/src/types/AsyncNode').default} AsyncNode */
/** @typedef {import('@dbux/common/src/types/StaticContext').default} StaticContext */
/** @typedef {import('@dbux/common/src/types/ExecutionContext').default} ExecutionContext */
/** @typedef { import('@dbux/common/src/types/constants/DataNodeType').DataNodeTypeValue } DataNodeTypeValue */

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

/** ###########################################################################
 * snapshot utils
 *  #########################################################################*/

/**
 * @typedef {{ refId: number, children: IDataSnapshot[] }} IDataSnapshot
 */

const DefaultDataSnapshotMods = {
  /**
   * @param {RuntimeDataProvider} dp
   * @param {IDataSnapshot} snapshot
   * @param {DataNode} modifyNode
   * @param {string} prop
   */
  writeRef(dp, snapshot, modifyNode, prop) {
    snapshot.children[prop] = new RefSnapshot(modifyNode.nodeId, modifyNode.refId, null);
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @param {IDataSnapshot} snapshot
   * @param {DataNode} modifyNode
   * @param {string} prop
   */
  writePrimitive(dp, snapshot, modifyNode, prop) {
    // TODO: possibly keep following valueFrom (see `BaseDDG#addDataNode`)
    const inputNodeId = modifyNode.valueFromId;
    const inputNode = !inputNodeId ? modifyNode : dp.collections.dataNodes.getById(inputNodeId);
    snapshot.children[prop] = new RefSnapshot(modifyNode.nodeId, null, inputNode.value);
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @param {IDataSnapshot} snapshot
   * @param {DataNode} modifyNode
   * @param {string} prop
   */
  deleteProp(dp, snapshot, modifyNode, prop) {
    delete snapshot.children[prop];
  }
};

/**
 * @typedef {typeof DefaultDataSnapshotMods} IDataSnapshotMods
 */

/** ###########################################################################
 * util used for rendering strings
 * ##########################################################################*/

const ShortenMaxLength = 20;
const ShortStringCfg = { length: ShortenMaxLength - 2 };

const TruncateDefaultCfg = { length: 60 - 2 };

/**
 * @param {string} s 
 */
function truncateStringShort(s, cfg = ShortStringCfg) {
  return truncate(s.replace(/\s+/g, ' '), cfg);
}
/**
 * @param {string} s 
 */
function truncateStringDefault(s, cfg = TruncateDefaultCfg) {
  return truncate(s.replace(/\s+/g, ' '), cfg);
}

const dataProviderUtil = {

  // ###########################################################################
  // Program utils
  // ###########################################################################
  /** @param {RuntimeDataProvider} dp */
  getFilePathFromProgramId(dp, programId) {
    return dp.collections.staticProgramContexts.getById(programId)?.filePath || null;
  },

  /** 
   * @param {RuntimeDataProvider} dp
   */
  renderRelativeProgramFilePath(dp, programId) {
    const app = dp.application;

    let fpath = dp.util.getFilePathFromProgramId(programId);
    fpath = app.getPathRelativeToAppAncestorPath(fpath);

    fpath = renderPath(fpath);
    return fpath;
  },

  /** 
   * @deprecated Use `dp.queries.packages.getAll()` instead.
   * @param {RuntimeDataProvider} dp
   */
  getAllProgramsByPackage(dp) {
    const app = dp.application;

    let fpaths = dp.collections.staticProgramContexts.getAllActual().map(program => program.filePath);
    fpaths = app.getPathsRelativeToAppAncestorPath(fpaths);

    fpaths = fpaths.map(fpath => renderPath(fpath));
    return fpaths;
  },

  /** 
   * @param {RuntimeDataProvider} dp
   * @return {Array.<string>} Names of all modules from `node_modules` folders that were executed.
   */
  getProgramPackageName(dp, programId) {
    const programContext = dp.collections.staticProgramContexts.getById(programId);

    if ('_moduleName' in programContext) {
      return programContext._moduleName;
    }
    else {
      return programContext._moduleName = parsePackageName(programContext.filePath);
    }
  },

  getAllPackageNames(dp, startId = 1) {
    const programIds = new Set(
      dp.collections.staticProgramContexts
        .getAllActual(startId)
        .map(p => dp.util.getProgramPackageName(p.programId))
    );

    // NOTE: `getProgramPackageName` returns null if a program is not in `node_modules`.
    programIds.delete(null);

    return Array.from(programIds);
  },

  getStaticContextOfProgram(dp, programId) {
    // assumption: first staticContext of program should be the program itself.
    return dp.indexes.staticContexts.byFile.getFirst(programId);
  },

  getStaticContextsOfProgram(dp, programId) {
    return dp.indexes.staticContexts.byFile.get(programId);
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstTraceOfProgram(dp, programId) {
    const staticContext = dp.util.getStaticContextOfProgram(programId);
    if (staticContext) {
      return dp.util.getFirstTraceOfStaticContext(staticContext.staticContextId);
    }
    return null;
  },

  getTracesOfProgram(dp, programId) {
    return dp.indexes.traces.byFile.get(programId);
  },

  // ###########################################################################
  // contexts
  // ###########################################################################

  /** @param {RuntimeDataProvider} dp */
  getAllRootContexts(dp) {
    return dp.indexes.executionContexts.roots.get(1) || EmptyArray;
  },

  /** @param {RuntimeDataProvider} dp */
  getRootContextOfContext(dp, contextId) {
    // const { executionContexts } = dp.collections;
    // const context = executionContexts.getById(contextId);
    // if (!context._rootContextId) {
    //   let currentContextId = contextId;
    //   let parentContextId;
    //   while (
    //     !dp.util.isRootContext(currentContextId) &&
    //     (parentContextId = executionContexts.getById(currentContextId).parentContextId)) {
    //     currentContextId = parentContextId;
    //   }
    //   context._rootContextId = currentContextId;
    // }
    // return executionContexts.getById(context._rootContextId);

    const firstTrace = dp.util.getFirstTraceOfContext(contextId);
    const rootContextId = firstTrace?.rootContextId;
    const rootContext = rootContextId && dp.collections.executionContexts.getById(rootContextId) || null;
    return rootContext;
  },

  /** @param {RuntimeDataProvider} dp */
  getRootContextOfTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    return dp.collections.executionContexts.getById(trace.rootContextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstContextsInRuns(dp) {
    return dp.indexes.executionContexts.firstInRuns.get(1);
  },

  /** @param {RuntimeDataProvider} dp */
  isRootContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    if (!context.parentContextId || context.isVirtualRoot) {
      return true;
    }
    return false;
  },

  /**
   * @deprecated We don't use runs anymore.
   * @param {RuntimeDataProvider} dp
   */
  getFirstTracesInRuns(dp) {
    return dp.indexes.traces.firsts.get(1);
  },

  /**
   * Get all contexts in which an object of given `refId` has been recorded.
   * 
   * @param {RuntimeDataProvider} dp
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
   * Find a context's parent in call stack, looking for async parent if it is a root context.
   * NOTE: used in `AsyncCallStack`, `RootEdgesTDNode` and `ParentContext navigation` for consistency
   * @param {RuntimeDataProvider} dp 
   * @param {number} contextId 
   */
  getContextAsyncStackParent(dp, contextId) {
    const { parentContextId } = dp.collections.executionContexts.getById(contextId);
    if (!dp.util.isRootContext(contextId)) {
      // // not a root, get real parent
      // return dp.util.getRealContextOfContext(parentContextId);

      // not a root, get parent
      return dp.collections.executionContexts.getById(parentContextId);
    }
    else {
      const realContext = dp.util.getRealContextOfContext(contextId);
      if (realContext.contextId !== contextId) {
        // real context is not itself
        return realContext;
      }

      // is real root, looking for async parent
      const fromAsyncEvent = dp.indexes.asyncEvents.to.getFirst(contextId);
      if (fromAsyncEvent) {
        const schedulerTrace = dp.util.getCallerOrSchedulerTraceOfContext(contextId);
        const depth = dp.util.getNestedDepth(contextId);
        const schedulerDepth = dp.util.getNestedDepth(schedulerTrace.rootContextId);
        if (depth < schedulerDepth) {
          return dp.util.getContextAsyncStackParent(schedulerTrace.rootContextId);
        }
        else {
          const context = dp.collections.executionContexts.getById(schedulerTrace.contextId);
          return context;
        }
      }

      return null;
    }
  },

  /** @param {RuntimeDataProvider} dp */
  getContextProgram(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    return dp.util.getStaticContextProgram(context.staticContextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getContextFilePath(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const programContext = dp.util.getStaticContextProgram(context.staticContextId);
    return programContext.filePath;
  },

  /** @param {RuntimeDataProvider} dp */
  getStaticContextProgram(dp, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    return dp.collections.staticProgramContexts.getById(staticContext.programId);
  },

  /** @param {RuntimeDataProvider} dp */
  getContextPackageName(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    return dp.util.getStaticContextPackageName(context.staticContextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getStaticContextPackageName(dp, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    return dp.util.getProgramPackageName(staticContext.programId);
  },

  /** @param {RuntimeDataProvider} dp */
  getTracePackageName(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    return dp.util.getContextPackageName(trace.contextId);
  },

  /** @param {RuntimeDataProvider} dp */
  countExecutedFunctionsOfProgram(dp, programId) {
    // const contexts = dp.indexes.executionContexts.byStaticContext.get(staticContext.staticContextIdId);
    const staticContexts = dp.util.getStaticContextsOfProgram(programId);
    return staticContexts ? sum(
      staticContexts.map(staticContext => !!dp.indexes.traces.byStaticContext.get(staticContext.staticContextId))
    ) + 0 : 0;
  },

  // ###########################################################################
  // static contexts + static traces
  // ###########################################################################

  /** @param {RuntimeDataProvider} dp */
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

  /** @param {RuntimeDataProvider} dp */
  getRunCreatedAt(dp, runId) {
    return dp.indexes.executionContexts.byRun.get(runId)[0]?.createdAt || null;
  },

  // ###########################################################################
  // traces
  // ###########################################################################

  /** @param {RuntimeDataProvider} dp */
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

  /** @param {RuntimeDataProvider} dp */
  getFirstTraceOfContext(dp, contextId) {
    return dp.indexes.traces.byContext.getFirst(contextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstTraceOfRealContext(dp, realContextId) {
    return dp.indexes.traces.byRealContext.getFirst(realContextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getLastTraceOfContext(dp, contextId) {
    const traces = dp.indexes.traces.byContext.get(contextId);
    if (!traces?.length) {
      return null;
    }
    return traces[traces.length - 1];
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstTraceOfStaticContext(dp, staticContextId) {
    const firstContext = dp.indexes.executionContexts.byStaticContext.getFirst(staticContextId);
    if (firstContext) {
      return dp.util.getFirstTraceOfContext(firstContext.contextId);
    }
    return null;
  },

  /**
   * Returns the parentTrace of a context, not necessarily a BCE.
   * Use `getOwnCallerTraceOfContext` if you want the BCE of a context.
   * 
   * @param {RuntimeDataProvider} dp 
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

  /**
   * @deprecated Runs are no longer. Use roots (CGRs) instead.
   *  @param {RuntimeDataProvider} dp 
   */
  getFirstTraceOfRun(dp, runId) {
    const traces = dp.indexes.traces.byRun.get(runId);
    if (!traces?.length) {
      return null;
    }
    return traces[0];
  },

  /** @param {RuntimeDataProvider} dp */
  getLastTraceOfRun(dp, runId) {
    const traces = dp.indexes.traces.byRun.get(runId);
    if (!traces?.length) {
      return null;
    }
    return traces[traces.length - 1];
  },

  /** @param {RuntimeDataProvider} dp */
  isFirstTraceOfRun(dp, traceId) {
    const { runId } = dp.collections.traces.getById(traceId);
    const firstTraceId = dp.util.getFirstTraceOfRun(runId).traceId;
    return firstTraceId === traceId;
  },

  /**
   * @see https://github.com/Domiii/dbux/issues/561
   * @param {RuntimeDataProvider} dp
   */
  getAllErrorTraces(dp) {
    return dp.indexes.traces.error.get(1) || EmptyArray;
  },

  /** @param {RuntimeDataProvider} dp */
  getParamTracesOfContext(dp, contextId) {
    const realContextId = dp.util.getRealContextIdOfContext(contextId);
    return dp.util.getTracesOfContextAndType(realContextId, TraceType.Param) || EmptyArray;
  },

  /** @param {RuntimeDataProvider} dp */
  getReturnArgumentTraceOfContext(dp, contextId) {
    const realContextId = dp.util.getRealContextIdOfContext(contextId);
    return dp.util.getTracesOfContextAndType(realContextId, TraceType.ReturnArgument)?.[0] || null;
  },

  /** ###########################################################################
   * Control traces and staticTraces
   * ##########################################################################*/

  /** @param {RuntimeDataProvider} dp */
  getStaticTraceControlId(dp, staticTraceId) {
    TODO
  },

  /** @param {RuntimeDataProvider} dp */
  getStaticTraceControlRole(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    return staticTrace.controlRole;
  },

  /** @param {RuntimeDataProvider} dp */
  isStaticTraceControlDecision(dp, staticTraceId) {
    const controlRole = dp.util.getStaticTraceControlRole(staticTraceId);
    return isTraceControlRoleDecision(controlRole);
  },

  /** @param {RuntimeDataProvider} dp */
  isTraceControlDecision(dp, traceId) {
    const staticTraceId = dp.util.getStaticTraceId(traceId);
    return dp.util.isStaticTraceControlDecision(staticTraceId);
  },

  /** @param {RuntimeDataProvider} dp */
  isStaticTraceControlGroupPop(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    return TraceType.is.PopImmediate(staticTrace.type) ||  // pop context
      isTraceControlRolePop(staticTrace.controlRole); // pop branch statement
  },

  /** @param {RuntimeDataProvider} dp */
  isTraceControlGroupPop(dp, traceId) {
    const staticTraceId = dp.util.getStaticTraceId(traceId);
    return dp.util.isStaticTraceControlGroupPop(staticTraceId);
  },

  // /** @param {DataProvider} dp */
  // getStaticTraceControlId(dp, staticTraceId) {
  //   TODO
  // },

  // ###########################################################################
  // Trace → DataNodes
  // ###########################################################################

  /**
   * @param {RuntimeDataProvider} dp
   * @return {DataNode} DataNode of value trace
   */
  getDataNodeIdOfTrace(dp, traceId) {
    const valueTrace = dp.util.getValueTrace(traceId);
    return valueTrace ? valueTrace.nodeId : 0;
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @return {DataNode} DataNode of value trace
   */
  getDataNodeOfTrace(dp, traceId) {
    const dataNodeId = dp.util.getDataNodeIdOfTrace(traceId);
    return dataNodeId ? dp.collections.dataNodes.getById(dataNodeId) : null;
  },

  /** 
   * WARNING: we probably need to rename things.
   * Usually, we probably want to use `dp.indexes.dataNodes.byTrace.get(traceId)` instead of this.
   * 
   * @param {RuntimeDataProvider} dp
   * @return {DataNode[]?}
   */
  getDataNodesOfTrace(dp, traceId) {
    // TODO: maybe pick a better name (the `valueTrace` irritates when dealing with BCEs)
    const valueTrace = dp.util.getValueTrace(traceId);
    return valueTrace ? dp.indexes.dataNodes.byTrace.get(valueTrace.traceId) : null;
  },

  /** @param {RuntimeDataProvider} dp */
  getLastDataNodeOfTrace(dp, traceId) {
    return last(dp.util.getDataNodesOfTrace(traceId));
  },

  /** @param {RuntimeDataProvider} dp */
  getLastDataNodeIdOfTrace(dp, traceId) {
    return last(dp.util.getDataNodesOfTrace(traceId))?.nodeId;
  },

  /** @param {RuntimeDataProvider} dp */
  isTraceOwnDataNode(dp, nodeId) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    const trace = dp.util.getTrace(dataNode.traceId);
    return trace.nodeId === nodeId;
  },

  /** @param {RuntimeDataProvider} dp */
  getOwnDataNodeOfTrace(dp, traceId) {
    const trace = dp.util.getTrace(traceId);
    return dp.collections.dataNodes.getById(trace.nodeId);
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @return {StaticTrace} 
   */
  getOwnStaticTraceOfDataNode(dp, nodeId) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (!dataNode) {
      return null;
    }
    const { traceId } = dataNode;
    const { staticTraceId, nodeId: traceNodeId } = dp.collections.traces.getById(traceId);
    const isTraceOwnDataNode = traceNodeId === nodeId;
    return isTraceOwnDataNode && dp.collections.staticTraces.getById(staticTraceId) || null;
  },

  /**
   * @param {RuntimeDataProvider} dp
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

  /**
   * NOTE: We want to link multiple traces against the same trace sometimes.
   *  E.g.: we want to treat the value of a `BCE` the same as its `CER`.
   * @param {RuntimeDataProvider} dp 
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

  /** @param {RuntimeDataProvider} dp */
  getValueRefOfTrace(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.getDataNodeValueRef(dataNode.nodeId) : null;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  doesTraceHaveValue(dp, traceId) {
    return !!dp.util.getDataNodeOfTrace(traceId);
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceDataInputIds(dp, traceId) {
    const dataNode = dp.util.getOwnDataNodeOfTrace(traceId);
    return dataNode?.inputs;
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstInputDataNodeOfTrace(dp, traceId) {
    const inputIds = dp.util.getTraceDataInputIds(traceId);
    return inputIds?.length ? dp.collections.dataNodes.getById(inputIds[0]) : null;
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceDeclarationTid(dp, traceId) {
    const dataNode = dp.util.getOwnDataNodeOfTrace(traceId);
    return dataNode?.varAccess?.declarationTid;
  },

  /** @param {RuntimeDataProvider} dp */
  isTraceTrackableValue(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.isDataNodeTrackableValue(dataNode.nodeId) : false;
  },

  /** @param {RuntimeDataProvider} dp */
  isTracePlainObjectOrArrayValue(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.isDataNodePlainObjectOrArrayValue(dataNode.nodeId) : false;
  },

  /** @param {RuntimeDataProvider} dp */
  isTracePlainObject(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.isDataNodePlainObject(dataNode.nodeId) : false;
  },

  /** @param {RuntimeDataProvider} dp */
  isTraceFunctionValue(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.isDataNodeFunctionValue(dataNode.nodeId) : false;
  },

  /** ###########################################################################
   * DataNode data
   *  #########################################################################*/

  /**
   * @param {RuntimeDataProvider} dp
   * @return {DataNode}
   */
  getDataNode(dp, dataNodeId) {
    return dp.collections.dataNodes.getById(dataNodeId);
  },

  /** @param {RuntimeDataProvider} dp */
  getPrimitiveDataNodes(dp) {
    return dp.indexes.dataNodes.simple.get(1) || EmptyArray;
  },

  /** @param {RuntimeDataProvider} dp */
  getDataNodeDeclarationTid(dp, dataNodeId) {
    const dataNode = dp.util.getDataNode(dataNodeId);
    return dataNode?.varAccess?.declarationTid;
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @return {DataNodeTypeValue}
   */
  getDataNodeType(dp, dataNodeId) {
    return dp.collections.dataNodes.getById(dataNodeId).type;
  },

  /** @param {RuntimeDataProvider} dp */
  isDataNodeTrackableValue(dp, nodeId) {
    const valueRef = dp.util.getDataNodeValueRef(nodeId);
    return valueRef && isObjectCategory(valueRef.category) || false;
  },

  /** @param {RuntimeDataProvider} dp */
  isDataNodePlainObjectOrArrayValue(dp, nodeId) {
    const valueRef = dp.util.getDataNodeValueRef(nodeId);
    return valueRef && isPlainObjectOrArrayCategory(valueRef.category) || false;
  },

  /** @param {RuntimeDataProvider} dp */
  isDataNodePlainObject(dp, nodeId) {
    const valueRef = dp.util.getDataNodeValueRef(nodeId);
    return valueRef && isPlainObjectOrArrayCategory(valueRef.category) || false;
  },

  /** @param {RuntimeDataProvider} dp */
  isDataNodeFunctionValue(dp, nodeId) {
    const valueRef = dp.util.getDataNodeValueRef(nodeId);
    return valueRef && isFunctionCategory(valueRef.category) || false;
  },

  /** 
   * A "pass-along" node is the Read of a variable or
   * a node that otherwise was only inserted to refer to a singular input read.
   * 
   * @param {RuntimeDataProvider} dp
   */
  isDataNodePassAlong(dp, nodeId) {
    const dataNode = dp.util.getDataNode(nodeId);
    return (
      // (DataNodeType.is.Read(dataNode.type)) &&
      !!dataNode.valueFromId
    );
  },

  _fixNonTrackableValue(value) {
    // if (isString(value)) {
    //   return value.replace('\n');//
    // }
    return value;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getDataNodeAccessedRefId(dp, nodeId) {
    return dp.util.getDataNodeAccessedRef(nodeId)?.refId || 0;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getDataNodeAccessedRef(dp, nodeId) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    const objectNodeId = dataNode.varAccess?.objectNodeId;
    if (objectNodeId) {
      const objectDataNode = dp.collections.dataNodes.getById(objectNodeId);
      return objectDataNode;
    }
    return 0;
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @return {DataNode}
   */
  getDataNodeModifyingRefId(dp, nodeId) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (isDataNodeModifyType(dataNode.type)) {
      return dp.util.getDataNodeAccessedRefId(nodeId) || 0;
    }
    return 0;
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @return {DataNode}
   */
  getDataNodeModifyingVarDeclarationTid(dp, nodeId) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (isDataNodeModifyType(dataNode.type)) {
      return dataNode?.varAccess?.declarationTid;
    }
    return 0;
  },


  /** ###########################################################################
   * {@link constructValueFull}
   * ##########################################################################*/

  /** 
   * Best-effort deep re-creation of a reference type object (object, array, set, map etc.)
   * 
   * @param {RuntimeDataProvider} dp
   */
  constructValueFull(dp, nodeId, toTraceId = null, _refId, _value, _visited = null) {
    const isRoot = !_visited;
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (isRoot) {
      _visited = new Set();
      ({ refId: _refId, value: _value } = dataNode);
      if (!toTraceId) {
        toTraceId = dataNode.traceId;
      }
    }

    let valueRef;
    if (_refId) {
      valueRef = dp.collections.values.getById(_refId);
      if (valueRef.pruneState) {
        return valueRef.value;
      }
      if (_visited.has(_refId)) {
        return '(circular reference)';
      }
      _visited.add(_refId);
    }

    let finalValue;
    if (!_refId) {
      finalValue = _value;
    }
    else {
      const snapshot = dp.util.constructVersionedValueSnapshot(_refId, toTraceId);
      if (!snapshot.children) {
        finalValue = _value;
      }
      else {
        const entries = Object.entries(snapshot.children); // NOTE: Object.entries works for both, array and object
        const constructedEntries = entries.
          map(([key, { nodeId: childNodeId, refId: childRefId, value: childValue }]) => {
            return [key, dp.util.constructValueFull(childNodeId, toTraceId, childRefId, childValue, _visited)];
          });

        if (ValueTypeCategory.is.Array(valueRef.category)) {
          // array
          finalValue = [];
          constructedEntries.forEach(([key, value]) => finalValue[key] = value);
        }
        else {
          // object
          finalValue = Object.fromEntries(constructedEntries);
        }
      }
    }

    return finalValue;
  },


  /** ###########################################################################
   * value snapshots
   * ##########################################################################*/

  /**
   * Creates a new shallow snapshot of the value of given `refId` at given 
   * point in time (`toTraceId`).
   * 
   * @param {RuntimeDataProvider} dp
   * @return {VersionedRefSnapshot}
   */
  constructVersionedValueSnapshot(dp, refId, toTraceId = Infinity) {
    const valueRef = dp.collections.values.getById(refId);

    const { /* category, */ nodeId, children, value } = valueRef;
    if (!children) {
      // NOTE: this is a ref DataNode
      // but it does not have proper serialization, or something else went wrong

      // TODO: find out all possible circumstances of this and deal with it properly
      const snapshotNode = new VersionedRefSnapshot(nodeId, 0, value);
      snapshotNode.toTraceId = toTraceId;
      return snapshotNode;
    }

    // create new snapshot
    const snapshot = new VersionedRefSnapshot(nodeId, refId, null);
    snapshot.toTraceId = toTraceId;
    snapshot.children = clone(children);  // shallow clone → creates Array or Object

    // apply all writes before `toTraceId`
    dp.util.applyDataSnapshotModifications(snapshot, 0, toTraceId);
    return snapshot;
  },

  /**
   * Creates a new snapshot from an existing snapshot, at a later point in time.
   * 
   * @param {RuntimeDataProvider} dp 
   * @param {VersionedRefSnapshot} snapshot 
   */
  constructNewValueSnapshot(dp, snapshot, fromTraceId, toTraceId) {
    // clone original snapshot
    const newSnapshot = typedShallowClone(snapshot);

    // apply modifications
    dp.util.applyDataSnapshotModifications(newSnapshot, fromTraceId, toTraceId);
    return newSnapshot;
  },

  /**
   * Creates a new snapshot from an existing {@link VersionedRefSnapshot}, at a later point in time.
   * 
   * @param {RuntimeDataProvider} dp 
   * @param {VersionedRefSnapshot} snapshot 
   * @param {number} toTraceId 
   */
  constructNewVersionedValueSnapshot(dp, snapshot, toTraceId = Infinity) {
    const newSnapshot = dp.util.constructNewValueSnapshot(snapshot, snapshot.toTraceId, toTraceId);
    newSnapshot.toTraceId = toTraceId;
    return newSnapshot;
  },

  // /**
  //  * Creates a new snapshot graph from an existing {@link RefSnapshot}, at a later point in time.
  //  * 
  //  * @param {RuntimeDataProvider} dp 
  //  * @param {RefSnapshot} snapshot 
  //  * @param {number} toTraceId 
  //  */
  // constructVersionedValueSnapshotGraph(dp, snapshot, toTraceId) {

  // },

  // /**
  //  * Creates a new snapshot graph from an existing {@link VersionedRefSnapshot}, at a later point in time.
  //  * 
  //  * @param {RuntimeDataProvider} dp 
  //  * @param {VersionedRefSnapshot} snapshot 
  //  * @param {number} toTraceId 
  //  */
  // constructNewValueSnapshotGraph(dp, snapshot, toTraceId) {

  // },

  /**
   * Applies all modifications between `fromTraceId` and `toTraceId` to given `snapshot`.
   * 
   * @param {RuntimeDataProvider} dp 
   * @param {IDataSnapshot} snapshot
   * 
   * @return {DataNode[]} modifyDataNodes
   */
  collectDataSnapshotModificationNodes(dp, refId, fromTraceId, toTraceId) {
    if (!toTraceId) {
      throw new Error(`expected "toTraceId" to be number but was "${toTraceId}"`);
    }
    // const { refId } = snapshot;
    return dp.indexes.dataNodes.byObjectRefId.get(refId)?.
      filter(node => {
        return (
          // time constraints
          // future-work: use binary search etc. to get the relevant segment faster
          (
            (!fromTraceId || node.traceId > fromTraceId) &&
            node.traceId <= toTraceId
          ) &&

          // writes only!
          isDataNodeModifyType(node.type)
        );
      }) || EmptyArray;
  },

  /**
   * Applies all modifications between `fromTraceId` and `toTraceId` to given `snapshot`.
   * 
   * @param {RuntimeDataProvider} dp 
   * @param {IDataSnapshot} snapshot
   * @param {IDataSnapshotMods} snapshotMods
   */
  applyDataSnapshotModifications(dp, snapshot, fromTraceId, toTraceId, snapshotMods = DefaultDataSnapshotMods) {
    const modifyDataNodes = dp.util.collectDataSnapshotModificationNodes(snapshot.refId, fromTraceId, toTraceId);

    dp.util.applyDataSnapshotModificationsDataNodes(snapshot, modifyDataNodes, snapshotMods);
  },

  /**
   * Applies all modifications in `modifyDataNodes` to `snapshot`.
   * 
   * @param {RuntimeDataProvider} dp 
   * @param {IDataSnapshot} snapshot
   * @param {DataNode[]} modifyDataNodes
   * @param {IDataSnapshotMods} snapshotMods
   */
  applyDataSnapshotModificationsDataNodes(dp, snapshot, modifyDataNodes, snapshotMods) {
    for (const modifyNode of modifyDataNodes) {
      if (isDataNodeWrite(modifyNode.type)) {
        // apply write
        const { prop } = modifyNode.varAccess;
        if (modifyNode.refId) {
          // ref
          snapshotMods.writeRef(dp, snapshot, modifyNode, prop);
        }
        else {
          // primitive
          snapshotMods.writePrimitive(dp, snapshot, modifyNode, prop);
        }
      }
      else if (modifyNode.type === DataNodeType.Delete) {
        // apply delete
        const { prop } = modifyNode.varAccess;
        snapshotMods.deleteProp(dp, snapshot, modifyNode, prop);
      }
      else {
        throw new Error(`unknown modifying DataNodeType type: ${modifyNode.type}`);
      }
    }
  },

  /** ###########################################################################
   * value strings
   * ##########################################################################*/

  /**
   * Return a string, describing only special circumstances of DataNodes.
   * @param {RuntimeDataProvider} dp
   */
  getDataNodeValueMessage(dp, nodeId) {
    const valueRef = dp.util.getDataNodeValueRef(nodeId);
    if (valueRef?.pruneState === ValuePruneState.Omitted) {
      return `(omitted value)`;
    }
    return null;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  hasAnyValue(dp, nodeId) {
    const dataNode = dp.util.getDataNode(nodeId);
    if (dataNode) {
      return !!(dataNode.hasValue || dataNode.refId);
    }
    return false;
  },

  /**
   * NOTE: this can return incorrect values if DataNode was omitted etc.
   * @param {RuntimeDataProvider} dp
   */
  isDataNodeValueTruthy(dp, nodeId) {
    const dataNode = dp.util.getDataNode(nodeId);
    if (dataNode.refId) {
      return true;
    }
    return !!dataNode.value;
  },

  /**
   * NOTE: this can return incorrect values if DataNode was omitted etc.
   * @param {RuntimeDataProvider} dp
   */
  isTraceValueTruthy(dp, traceId) {
    const dataNodeId = dp.util.getDataNodeIdOfTrace(traceId);
    if (!dataNodeId) {
      return false;
    }
    return dp.util.isDataNodeValueTruthy(dataNodeId);
  },

  /** 
   * internal helper
   * @param {RuntimeDataProvider} dp
   * @param {RefSnapshot} snapshot
   */
  _simplifyValue(dp, { refId, value }) {
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
    else if (isString(value)) {
      return renderValueSimple(value);
    }
    else {
      return String(value);
    }
  },

  /** 
   * @param {RuntimeDataProvider} dp
   */
  _getDataNodeValueString(dp, nodeId, traceId = null, shorten = false) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (!traceId) {
      // traceId = nodeId;
      traceId = dataNode.traceId;
    }

    // NOTE: cache is currently disabled since we need the value in different timepoints, which cannot be handled with single cache
    // // check cached string
    // if (shorten) {
    //   if (dataNode._valueStringShort) {
    //     return dataNode._valueStringShort;
    //   }
    // }
    // else if (dataNode._valueString) {
    //   return dataNode._valueString;
    // }

    // A message is generated if there is an issue with the value or it was omitted.
    const valueMessage = dp.util.getDataNodeValueMessage(nodeId);
    if (valueMessage) {
      return valueMessage;
    }

    // get value
    let valueString;
    const { refId, value, hasValue } = dataNode;

    if (refId) {
      valueString = dp.util.getValueRefValueStringShort(refId, traceId, shorten);
    }
    else {
      if (hasValue) {
        valueString = value?.toString?.() || String(value);
      }
      else {
        valueString = 'undefined';
      }
    }

    return valueString;
  },

  /** @param {RuntimeDataProvider} dp */
  getRefFirstDataNodeValueStringShort(dp, refId) {
    const dataNode = dp.util.getFirstDataNodeByRefId(refId);
    if (dataNode) {
      return dp.util.getDataNodeValueStringShort(dataNode.nodeId, dataNode.traceId);
    }
    return undefined;
  },

  /** @param {RuntimeDataProvider} dp */
  getDataNodeValueString(dp, nodeId, toTraceId = null) {
    return dp.util._getDataNodeValueString(nodeId, toTraceId, false);
  },

  /** @param {RuntimeDataProvider} dp */
  getDataNodeValueStringShort(dp, nodeId, toTraceId = null) {
    return dp.util._getDataNodeValueString(nodeId, toTraceId, true);
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceValueString(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    if (dataNode) {
      return dp.util.getDataNodeValueString(dataNode.nodeId, dataNode.traceId);
    }
    return '(no value or undefined)';
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceValueStringShort(dp, traceId, ignoreUndefined = false) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    if (dp.util.hasAnyValue(dataNode?.nodeId)) {
      return dp.util.getDataNodeValueStringShort(dataNode.nodeId, traceId);
    }
    if (ignoreUndefined) {
      return undefined;
    }
    return 'undefined';
  },

  /** @param {RuntimeDataProvider} dp */
  getValueRefValueStringShort(dp, refId, toTraceId, shorten = true) {
    const snapshot = dp.util.constructVersionedValueSnapshot(refId, toTraceId);
    const valueRef = dp.collections.values.getById(refId);

    let valueString;
    if (!snapshot?.children) {
      // node was omitted or did not have children for other reasons
      // default
      valueString = valueRef.value?.toString?.() || String(valueRef.value);
    }
    else {
      const { category, pruneState } = valueRef;
      if (!isPruneStateOk(pruneState)) {
        valueString = valueRef.value?.toString?.() || String(valueRef.value) || ValuePruneState.nameFrom(pruneState);
      }

      if (ValueTypeCategory.is.Array(category)) {
        let content = `${snapshot.children.map(childSnapshot => dp.util._simplifyValue(childSnapshot))}`;
        shorten && (content = truncateStringShort(content));
        valueString = `[${content}]`;
      }
      else if (ValueTypeCategory.is.Object(category)) {
        let content = `${Object.keys(snapshot.children)}`;
        shorten && (content = truncateStringShort(content));
        valueString = `{${content}}`;
      }
      else if (ValueTypeCategory.is.Function(category)) {
        let name = snapshot.getChildValue('name') || '(anonymous)';
        shorten && (name = truncateStringShort(name));
        valueString = `ƒ ${name}`;
      }
      else {
        // default
        valueString = valueRef.value?.toString?.() || String(valueRef.value);
      }
    }

    return valueString;
  },

  /** 
   * Uses some heuristics to find the first var a given ref was assigned to.
   * @param {RuntimeDataProvider} dp 
   */
  getRefVarName(dp, refId) {
    // 1. all dataNodes who held the value of given refId
    const dataNodes = dp.util.getDataNodesByRefId(refId);
    if (dataNodes) {
      // 2. find first DataNode that represents a variable
      const varNode = dataNodes.find(n => n.varAccess?.declarationTid);
      if (varNode) {
        // 3. return name of variable
        return dp.util.getDataNodeDeclarationVarName(varNode.nodeId);
      }
    }
    return null;
  },

  /** @param {RuntimeDataProvider} dp */
  getDataNodeDeclarationVarName(dp, dataNodeId) {
    const declarationTid = dp.util.getDataNodeDeclarationTid(dataNodeId);
    if (declarationTid) {
      const staticTrace = dp.util.getStaticTrace(declarationTid);
      return staticTrace.data?.name || staticTrace.displayName;
    }
    return null;
  },

  /** @param {RuntimeDataProvider} dp */
  getDataNodeAccessedRefVarName(dp, dataNodeId) {
    const refId = dp.util.getDataNodeAccessedRefId(dataNodeId);
    if (refId) {
      return dp.util.getRefVarName(refId);
    }
    return null;
  },

  /** ###########################################################################
   * more data associations
   * ##########################################################################*/

  /** @param {RuntimeDataProvider} dp */
  getTraceRefId(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode?.refId || null;
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceValueRef(dp, traceId) {
    const dataNode = dp.util.getDataNodeOfTrace(traceId);
    return dataNode ? dp.util.getDataNodeValueRef(dataNode.nodeId) : null;
  },

  /** @param {RuntimeDataProvider} dp */
  getDataNodeValueRef(dp, nodeId) {
    const dataNode = dp.collections.dataNodes.getById(nodeId);
    if (dataNode && dataNode.refId) {
      return dp.collections.values.getById(dataNode.refId);
    }
    return null;
  },

  /** @param {RuntimeDataProvider} dp */
  getAllTracesOfObjectOfTrace(dp, traceId) {
    const valueRef = dp.util.getTraceValueRef(traceId);
    if (valueRef?.refId) {
      return dp.indexes.traces.byRefId.get(valueRef.refId);
    }
    return null;
  },

  /** @param {RuntimeDataProvider} dp */
  getDataNodesByRefId(dp, refId) {
    return dp.indexes.dataNodes.byRefId.get(refId);
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstDataNodeByRefId(dp, refId) {
    return dp.indexes.dataNodes.byRefId.getFirst(refId);
  },

  /** 
   * Get first DataNode by refId, even if it does NOT OWN it.
   * NOTE: ValueRef#nodeId is the first nodeId that the ref was seen/recorded.
   * future-work: for consistency, consider using the same approach as `getLastNodeIdByRefId`
   * 
   * @param {RuntimeDataProvider} dp
   */
  getAnyFirstNodeIdByRefId(dp, refId) {
    const ref = dp.collections.values.getById(refId);
    const { nodeId } = ref;
    // const { traceId } = dp.collections.dataNodes.getById(nodeId);
    // return traceId;
    return nodeId;
  },

  /**
   * 
   * @param {RuntimeDataProvider} dp
   */
  getLastNodeIdByRefId(dp, refId) {
    const dataNode = dp.indexes.dataNodes.byRefId.getLast(refId);
    return dataNode?.nodeId;
  },

  /** 
   * Get first DataNode by refId, even if it does NOT OWN it.
   * 
   * @param {RuntimeDataProvider} dp
   */
  getAnyFirstNodeByRefId(dp, refId) {
    const nodeId = dp.util.getAnyFirstNodeIdByRefId(refId);
    return nodeId && dp.collections.dataNodes.getById(nodeId);
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getFirstTraceIdByNodeId(dp, nodeId) {
    const { traceId } = dp.collections.dataNodes.getById(nodeId);
    return traceId;
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstTraceIdByRefId(dp, refId) {
    const dataNode = dp.indexes.dataNodes.byRefId.getFirst(refId);
    return dataNode?.traceId;
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstTraceByRefId(dp, refId) {
    const traceId = dp.util.getFirstTraceIdByRefId(refId);
    return traceId && dp.util.getTrace(traceId);
  },


  // ###########################################################################
  // call related traces
  // ###########################################################################

  /** @param {RuntimeDataProvider} dp */
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

  /** @param {RuntimeDataProvider} dp */
  getCallRelatedTraceBCE(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    if (trace.callId) {
      return dp.collections.traces.getById(trace.callId);
    }
    return null;
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
   * @param {RuntimeDataProvider} dp
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
   * @param {RuntimeDataProvider} dp
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
   * @param {RuntimeDataProvider} dp
   */
  getCallIdOfTrace(dp, traceId) {
    return dp.util.getBCETraceOfTrace(traceId)?.traceId || null;
  },

  /**
   * Returns the BCE of a context, if it has one. Else it returns the last trace before the context.
   * NOTE: `parentTrace` of a context might not participate in a call, e.g. in case of getters or setters
   * NOTE: To get the actual caller of the context, see `util.getOwnCallerTraceOfContext`
   * @param {RuntimeDataProvider} dp 
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
   * @param {RuntimeDataProvider} dp
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
   * @param {RuntimeDataProvider} dp 
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
   * @param {RuntimeDataProvider} dp 
  */
  getStaticCallId(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    return staticTrace.resultCallId || staticTrace.callId;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getCallArgTraces(dp, callId) {
    const bceTrace = dp.collections.traces.getById(callId);
    return bceTrace.data?.argTids.map(tid => dp.collections.traces.getById(tid));
  },

  /**
   * given the `dataNode` of (what should be) an array, return its element DataNodes.
   * 
   * @param {RuntimeDataProvider} dp
   */
  getArrayDataNodes(dp, dataNode) {
    if (!dataNode) {
      return EmptyArray;
    }
    const snapshot = dp.util.constructVersionedValueSnapshot(dataNode.refId, dataNode.nodeId);
    if (!Array.isArray(snapshot.children)) {
      return EmptyArray;
    }

    return snapshot.children.map(({ nodeId: childNodeId/* , refId: childRefId, value: childValue */ }) =>
      dp.util.getDataNode(childNodeId)
    );
  },

  /**
   * NOTE: This also flattens spread arguments.
   *
   * @param {RuntimeDataProvider} dp
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
      if (!dataNodes) {
        logError(`Argument trace #${t.traceId} does not have data nodes, which will likely lead to data flow analysis inaccuracies.`);
        return null;
      }
      if (!argConfigs[i]?.isSpread) {
        // not spread -> take the argument's own `DataNode`
        return dataNodes[0];
      }
      // spread -> take all of the spread argument's additional `DataNode`s (which are the argument DataNodes)
      return dataNodes.slice(1);
    }).filter(Boolean);

    // handle call, apply, bind
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

    // special handling for bind
    if (bceTrace?.data.calleeTid) {
      // check for `Bound`
      const bindTrace = dp.util.getBindCallTrace(bceTrace.data.calleeTid);
      const boundArgNodes = bindTrace && dp.util.getCallArgDataNodes(bindTrace.traceId);
      if (boundArgNodes) {
        argDataNodes = [
          // NOTE: first argument to `bind` is `thisArg` -> don't map to parameter
          ...(boundArgNodes?.slice(1) || EmptyArray),
          ...(argDataNodes || EmptyArray)
        ];
      }
    }

    return argDataNodes;
  },

  /**
   * Returns array of values of args, but only for primitive values.
   * Non-primitive argument values will be `undefined`.
   * 
   * @param {RuntimeDataProvider} dp
   */
  getCallArgPrimitiveValues(dp, callId) {
    const dataNodes = dp.util.getCallArgDataNodes(callId);
    return dataNodes?.map(node => node.value);
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getCallArgValueStrings(dp, callId) {
    const dataNodes = dp.util.getCallArgDataNodes(callId);
    return dataNodes?.map(node => dp.util.getDataNodeValueString(node.nodeId, node.traceId));
  },

  /**
   * Render accurate string result.
   * future-work: formatting for console.table et al?
   * 
   * @param {RuntimeDataProvider} dp
   */
  renderConsoleMessage(dp, consoleCallId) {
    const stringArgs = dp.util.getCallArgValueStrings(consoleCallId)
      .map(arg => isString(arg) ? arg : (arg + ''))
      .map(arg => stripAnsi(arg));

    /**
     * "the arguments are all passed to util.format()"
     * @see https://nodejs.org/api/console.html#consolelogdata-args
     */
    return format(...stringArgs);
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @return the ValueRef of given `context`'s BCE. We use it to get an `async` function call's own promise.
   */
  getCallValueRefOfContext(dp, contextId) {
    const bceTrace = dp.util.getOwnCallerTraceOfContext(contextId);
    return bceTrace && dp.util.getTraceValueRef(bceTrace.traceId) || null;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getReturnValueRefOfInterruptableContext(dp, realContextId) {
    const returnTrace = dp.util.getReturnTraceOfInterruptableContext(realContextId);
    return returnTrace && dp.util.getTraceValueRef(returnTrace.traceId);
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getReturnValueRefOfContext(dp, contextId) {
    const returnTrace = dp.util.getReturnTraceOfContext(contextId);
    return returnTrace && dp.util.getTraceValueRef(returnTrace.traceId);
  },

  /**
   * Requires the given context to have (virtual) child contexts.
   * WARNING: does not work for non-interruptable functions.
   * @param {RuntimeDataProvider} dp
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
    return dp.util.getReturnTraceOfContext(realContextId) || null;
  },

  /**
   * WARNING: does not work for `realContextId` of interruptable functions (need virtual `Resume` contextId instead).
   *    → In that case: use {@link #getReturnTraceOfInterruptableContext} instead.
   * 
   * @param {RuntimeDataProvider} dp
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

  /** ###########################################################################
   * callees
   * ##########################################################################*/

  /**
   * Accounts for `call`, `apply`, `bind`.
   * @param {RuntimeDataProvider} dp
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
      case SpecialCallType.Bind:
      default: {
        // nothing to do here -> handle `Bound` case below
        break;
      }
    }

    // no match -> check for Bound
    const { calleeTid } = bceTrace.data;
    const bindTrace = dp.util.getBindCallTrace(calleeTid);
    if (bindTrace?.data) {
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
   * @example `o` in `o.f(x)`
   * 
   * @param {RuntimeDataProvider} dp
   */
  getCalleeObjectNodeId(dp, callId) {
    const calleeTrace = dp.util.getRealCalleeTrace(callId);
    if (calleeTrace) {
      const calleeDataNode = dp.util.getOwnDataNodeOfTrace(calleeTrace.traceId);
      const calleeObjectNodeId = calleeDataNode?.varAccess.objectNodeId;
      return calleeObjectNodeId;
      // return calleeObjectNodeId && dp.util.getDataNode(calleeObjectNodeId);
    }
    return null;
  },

  /**
   * @deprecated Use {@link dataProviderUtil#getRealCalleeTrace} instead
   * @param {RuntimeDataProvider} dp
   */
  getCalleeTraceId(dp, callId) {
    return dp.collections.traces.getById(callId)?.data?.calleeTid;
  },

  /** @param {RuntimeDataProvider} dp */
  getCalleeTrace(dp, callId) {
    return dp.util.getTrace(dp.util.getCalleeTraceId(callId));
  },

  // getTracesOfCalledContext(dp, callId) {
  //   return dp.indexes.traces.byCallerTrace.get(callId) || EmptyArray;
  // },

  /**
   * Given a `callId` (traceId of a CallExpression), returns whether its callee was recorded (i.e. instrumented/traced).
   * NOTE: Some calls have an underlying context, but that is not the context of the function was called.
   *    -> e.g. `array.map(f)` might have recorded f's context, but `f` is not `array.map` (the actual callee).
   * @param {RuntimeDataProvider} dp
   */
  isCalleeTraced(dp, callId) {
    const context = dp.util.getCalledContext(callId);
    return context && !!dp.util.getOwnCallerTraceOfContext(context.contextId);
  },

  /** ###########################################################################
   * more caller and CallExpression stuff
   * ##########################################################################*/

  /**
   * @param {RuntimeDataProvider} dp
   */
  getCalledContext(dp, callId) {
    return dp.indexes.executionContexts.byCallerTrace.getFirst(callId);
  },

  /**
   * NOTE: Contexts having common callee trace must be siblings.
   * @param {RuntimeDataProvider} dp
   */
  getFirstTraceByCallerTrace(dp, callId) {
    const firstContext = dp.indexes.executionContexts.byCallerTrace.getFirst(callId);
    return dp.indexes.traces.byContext.getFirst(firstContext?.contextId);
  },

  /**
   * NOTE: Contexts having common callee trace must be siblings.
   * @param {RuntimeDataProvider} dp
   */
  getLastTraceByCallerTrace(dp, callId) {
    const lastContext = dp.indexes.executionContexts.byCallerTrace.getLast(callId);
    return dp.indexes.traces.byContext.getLast(lastContext?.contextId);
  },

  /**
   * @param {RuntimeDataProvider} dp
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
   * @param {RuntimeDataProvider} dp
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
   * like `util.getCallerTraceOfContext` but returns null if its context's `definitionTid` does not match the callee.
   * @param {RuntimeDataProvider} dp 
   * @param {number} contextId
   */
  getOwnCallerTraceOfContext(dp, contextId) {
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

    // const { traceId } = dp.collections.dataNodes.getById(functionRef.nodeId);
    // const context = dp.collections.executionContexts.getById(contextId);
    // if (context.definitionTid === traceId) { // NOTE: in case of ctor, refId is the same, but trace is different
    if (functionRef.refId === calleeDataNode.refId) {
      // Accept: definitionTid are matched
      return bceTrace;
    }
    else {
      // Reject
      return null;
    }
  },

  /**
   * Hackfix: Wrapper for CallGraph ContextNode, only render `call` and `value` for the first context with same caller.
   * @see https://github.com/Domiii/dbux/issues/561 - fix CallGraph rendering for HoF's (map et al.)
   * @param {*} dp 
   * @param {*} contextId 
   * @returns 
   */
  getCallerOrSchedulerTraceOfFirstContext(dp, contextId) {
    const callerOrScheduler = dp.util.getCallerOrSchedulerTraceOfContext(contextId);
    const isFirstOfCaller = dp.indexes.executionContexts.byCallerTrace.getFirst(callerOrScheduler?.traceId)?.contextId !== contextId;
    if (!dp.util.isRootContext(contextId) && isFirstOfCaller) {
      return null;
    }
    else {
      return callerOrScheduler;
    }
  },

  /**
   * Return scheduler trace of a `root context` and return caller trace otherwise.
   * @param {RuntimeDataProvider} dp
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
   * @param {RuntimeDataProvider} dp
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
   * @param {RuntimeDataProvider} dp
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

  /** @param {RuntimeDataProvider} dp */
  getTraceContextId(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    return contextId;
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceContext(dp, traceId) {
    const contextId = dp.util.getTraceContextId(traceId);
    return dp.collections.executionContexts.getById(contextId);
  },

  /** @param {RuntimeDataProvider} dp */
  isTraceInRealContext(dp, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    const { contextType } = dp.collections.executionContexts.getById(contextId);

    return isRealContextType(contextType);
  },

  /** @param {RuntimeDataProvider} dp */
  getLastChildContextOfContext(dp, realContextId) {
    return dp.indexes.executionContexts.children.getLast(realContextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getRealStaticContextIdOfContext(dp, contextId) {
    return dp.util.getRealContextOfContext(contextId)?.staticContextId;
    // const context = dp.collections.executionContexts.getById(contextId);

    // // NOTE: "first virtual" context of context is "real context"

    // if (isRealContextType(context?.contextType)) {
    //   return context.staticContextId;
    // }

    // // const parentContextId = context?.parentContextId;
    // const staticContextId = context?.staticContextId;
    // const staticContext = staticContextId && dp.collections.staticContexts.getById(staticContextId);
    // let parentStaticContext;

    // if (
    //   staticContext?.parentId &&
    //   (parentStaticContext = dp.collections.staticContexts.getById(staticContext?.parentId))
    //   // &&      isRealStaticContext(parentStaticContext.type)
    // ) {
    //   return parentStaticContext.staticContextId;
    // }
    // else {
    //   // if (parentContextId && !dp.collections.executionContexts.getById(parentContextId))

    //   // eslint-disable-next-line max-len
    //   dp.logger.trace(`Could not find realContext for contextId=${contextId}, parentStaticContext=${parentStaticContext}, parentStaticContext=`, parentStaticContext);
    //   return null;
    // }
    // // const realContext = dp.util.getRealContextOfContext(contextId);
    // // return realContext.staticContextId;
  },

  /** @param {RuntimeDataProvider} dp */
  getRealStaticContextIdOfStaticContext(dp, staticContextId) {
    const { parentId } = dp.collections.staticContexts.getById(staticContextId);

    // NOTE: "first virtual" context of context is "real context"

    if (dp.util.isRealStaticContext(staticContextId)) {
      return staticContextId;
    }


    let parentStaticContext;

    if (
      parentId &&
      (parentStaticContext = dp.collections.staticContexts.getById(parentId))
      // && isRealStaticContext(parentStaticContext.type)
    ) {
      return parentStaticContext.staticContextId;
    }
    else {
      // if (parentContextId && !dp.collections.executionContexts.getById(parentContextId))

      // eslint-disable-next-line max-len
      dp.logger.trace(`Could not find realContext for staticContextId=${staticContextId}, parentStaticContext=${parentStaticContext}, parentStaticContext=`, parentStaticContext);
      return null;
    }
    // const realContext = dp.util.getRealContextOfContext(contextId);
    // return realContext.staticContextId;
  },

  /** @param {RuntimeDataProvider} dp */
  isRealStaticContext(dp, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    if (!isVirtualStaticContextType(staticContext.type)) {
      return true;
    }
    else if (staticContext.isInterruptable) {
      // `isInterruptable === true` for the first virtual context
      return true;
    }

    return false;
  },

  /** @param {RuntimeDataProvider} dp */
  getRealContextIdOfTrace(dp, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    return dp.util.getRealContextIdOfContext(contextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getRealContextOfTrace(dp, traceId) {
    const { contextId } = dp.collections.traces.getById(traceId);
    return dp.util.getRealContextOfContext(contextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getRealContextIdOfContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);

    // if (isRealContextType(context?.contextType)) {
    //   return contextId;
    // }

    let parentContext;
    const realContextId = context?.realContextId;
    if (
      realContextId &&
      (parentContext = dp.collections.executionContexts.getById(realContextId))
    ) {
      // looked up actual realContextId
      return realContextId;
    }
    else {
      // default
      return contextId;
    }
  },

  /** @param {RuntimeDataProvider} dp */
  getRealContextOfContext(dp, contextId) {
    const realContextId = dp.util.getRealContextIdOfContext(contextId);
    return dp.collections.executionContexts.getById(realContextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getTracesOfRealContext(dp, traceId) {
    const realContextId = dp.util.getRealContextIdOfTrace(traceId);
    return dp.indexes.traces.byRealContext.get(realContextId);
  },

  /** @param {RuntimeDataProvider} dp */
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

  /** @param {RuntimeDataProvider} dp */
  getContextStaticContext(dp, contextId) {
    const staticContextId = dp.util.getContextStaticContextId(contextId);
    return dp.collections.staticContexts.getById(staticContextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceStaticContext(dp, traceId) {
    const staticContextId = dp.util.getTraceStaticContextId(traceId);
    return dp.collections.staticContexts.getById(staticContextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstContextOfRun(dp, runId) {
    const contexts = dp.indexes.executionContexts.byRun.get(runId);
    if (!contexts?.length) {
      return null;
    }
    return contexts[0];
  },

  /** @param {RuntimeDataProvider} dp */
  isFirstContextOfRun(dp, contextId) {
    const { runId } = dp.collections.executionContexts.getById(contextId);
    const firstContextId = dp.util.getFirstContextOfRun(runId)?.contextId;
    return firstContextId === contextId;
  },

  /** @param {RuntimeDataProvider} dp */
  isFirstAwait(dp, resumeContextId) {
    const context = dp.collections.executionContexts.getById(resumeContextId);
    const { realContextId } = context;
    return realContextId === resumeContextId;
  },

  /** @param {RuntimeDataProvider} dp */
  isFirstContextInParent(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const { parentContextId } = context;
    if (parentContextId) {
      return dp.indexes.executionContexts.children.getFirst(parentContextId) === context;
    }
    return false;
  },

  /** @param {RuntimeDataProvider} dp */
  getRealCalledContext(dp, callId) {
    const calledContext = dp.util.getCalledContext(callId);
    const contextId = calledContext && dp.util.getRealContextIdOfContext(calledContext.contextId);
    return contextId && dp.collections.executionContexts.getById(contextId);
  },

  // ###########################################################################
  // misc
  // ###########################################################################

  /** @param {RuntimeDataProvider} dp */
  getTraceContextType(dp, traceId) {
    const staticContext = dp.util.getTraceStaticContext(traceId);
    return staticContext.type;
  },

  /** @param {RuntimeDataProvider} dp */
  getTrace(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    return trace;
  },

  /** @param {RuntimeDataProvider} dp */
  getExecutionContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    return context;
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @return {StaticContext}
   */
  getStaticContextOfContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    const { staticContextId } = context;
    return dp.collections.staticContexts.getById(staticContextId);
    // return dp.collections.staticProgramContexts.
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @return {number}
   */
  getStaticContextIdOfContext(dp, contextId) {
    const context = dp.collections.executionContexts.getById(contextId);
    return context.staticContextId;
  },

  /** @param {RuntimeDataProvider} dp */
  isContextProgramContext(dp, contextId) {
    const staticContext = dp.util.getStaticContextOfContext(contextId);
    return staticContext.type === StaticContextType.Program;
  },

  /** @param {RuntimeDataProvider} dp */
  isContextFunctionContext(dp, contextId) {
    const staticContext = dp.util.getStaticContextOfContext(contextId);
    return staticContext.type === StaticContextType.Function;
  },

  /** @param {RuntimeDataProvider} dp */
  getProgramContextFilePath(dp, contextId) {
    const staticContext = dp.util.getStaticContextOfContext(contextId);
    return dp.util.getFilePathFromProgramId(staticContext.programId);
  },

  /** 
   * @param {RuntimeDataProvider} dp
   * @return {number}
   */
  getStaticTraceId(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { staticTraceId } = trace;
    return staticTraceId;
  },

  /** 
   * @param {RuntimeDataProvider} dp
   * @return {StaticTrace}
   */
  getStaticTrace(dp, traceId) {
    const staticTraceId = dp.util.getStaticTraceId(traceId);
    return dp.collections.staticTraces.getById(staticTraceId);
  },

  /** @param {RuntimeDataProvider} dp */
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

  /** @param {RuntimeDataProvider} dp */
  getStaticTraceProgramPath(dp, staticTraceId) {
    const programId = dp.util.getStaticTraceProgramId(staticTraceId);
    return dp.util.getFilePathFromProgramId(programId);
  },

  /** @param {RuntimeDataProvider} dp */
  getStaticTraceDisplayName(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    return staticTrace.displayName;
  },

  /** @param {RuntimeDataProvider} dp */
  getTracesOfStaticTrace(dp, staticTraceId) {
    return dp.indexes.traces.byStaticTrace.get(staticTraceId);
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceProgramPath(dp, traceId) {
    const programId = dp.util.getTraceProgramId(traceId);
    return dp.util.getFilePathFromProgramId(programId);
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceProgramId(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);

    const {
      staticTraceId,
    } = trace || EmptyObject;

    return dp.util.getStaticTraceProgramId(staticTraceId);
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceFilePath(dp, traceId) {
    const programId = dp.util.getTraceProgramId(traceId);
    return programId && dp.util.getFilePathFromProgramId(programId) || null;
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceFileName(dp, traceId) {
    const programId = dp.util.getTraceProgramId(traceId);
    return programId && dp.collections.staticProgramContexts.getById(programId).fileName || null;
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceLoc(dp, traceId) {
    const staticTrace = dp.util.getStaticTrace(traceId);
    return staticTrace.loc;
  },

  // ###########################################################################
  // SpecialIdentifierType
  // ###########################################################################

  /**
   * @param {RuntimeDataProvider} dp
   */
  getTracesOfSpecialIdentifierType(dp, specialType, startId = 1) {
    return dp.indexes.traces.bySpecialIdentifierType.get(specialType) || EmptyArray;
  },

  /** ###########################################################################
   * Require
   * ##########################################################################*/

  /**
   * @param {RuntimeDataProvider} dp
   */
  getAllRequireTraces(dp, startId = 1) {
    return dp.util.getTracesOfSpecialIdentifierType(SpecialIdentifierType.Require, startId);
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getAllRequirePaths(dp, startId = 1) {
    // NOTE: these should be BCE traces, meaning traceId === callId
    const traces = dp.util.getAllRequireTraces(startId);

    // get all first arguments of `require`
    // TODO: currently, first arguments are not traced in case of constant expression -> store in `staticTrace` instead!
    return traces.map(t => {
      const primitiveArgs = dp.util.getCallArgPrimitiveValues(t.traceId);
      return primitiveArgs?.[0];
    }).filter(t => !!t);
  },

  /**
   * Return the name of all packages required 
   * @param {RuntimeDataProvider} dp
   */
  getAllRequirePackageNames(dp, startId = 1) {
    const set = new Set(
      dp.util.getAllRequirePaths(startId)
        .map(p => p.split('/', 1)[0])
    );
    set.delete('.');
    set.delete('..');
    return Array.from(set);
  },

  // ###########################################################################
  // trace grouping/searching
  // ###########################################################################

  // /**
  //  * @param {DataProvider} dp
  //  */
  // isContextVirtual(dp, contextId) {
  //   const context = dp.collections.executionContexts.getById(contextId);
  //   const {
  //     contextType
  //   } = context;
  //   return isVirtualContextType(contextType);
  // },

  /**
   * @param {RuntimeDataProvider} dp 
   */
  getAllTracesOfRealStaticContext(dp, staticContextId) {
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    if (!staticContext) {
      return null;
    }

    const realStaticContextId = dp.util.getRealStaticContextIdOfStaticContext(staticContextId);
    return realStaticContextId && dp.indexes.traces.byRealStaticContext.get(realStaticContextId) || EmptyArray;

    // const {
    //   type: staticContextType
    // } = staticContext;
    // const parentStaticContext = dp.collections.staticContexts.getById(parentStaticContextId);
    // let traces;
    // if (isVirtualStaticContextType(staticContextType)) {
    // }
    // else {
    //   // find all traces belonging to that staticContext
    //   traces = dp.indexes.traces.byStaticContext.get(staticContextId) || EmptyArray;
    // }
    // return traces;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getAllTracesOfType(dp, traceType) {
    return dp.collections.traces.getAllActual().filter(t => dp.util.getTraceType(t.traceId) === traceType);
  },

  /**
   * Groups traces by TraceType, as well as staticTraceId.
   * 
   * future-work: improve performance, use MultiKeyIndex instead
   * @param {RuntimeDataProvider} dp 
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

  /**
   * @param {RuntimeDataProvider} dp
   */
  asContext(dp, isOrHasAContextId) {
    let id;
    if (isOrHasAContextId?.contextId) {
      id = isOrHasAContextId?.contextId;
    }
    else {
      id = isOrHasAContextId;
    }
    return dp.collections.executionContexts.getById(id);
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  makeStaticContextInfo(dp, staticContextId, addLoc = true, addPrefix = true) {
    /**
     * @type {StaticContext}
     */
    // const staticContext = dp.util.getStaticContextOfContext(staticContextId);
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    const { displayName, loc, type } = staticContext;
    const program = dp.util.getStaticContextProgram(staticContextId);
    const { filePath } = program;
    const prefix = addPrefix ? `[${StaticContextType.nameFrom(type)}] ` : '';
    const locLabel = addLoc ? ` @ ${filePath}:${locToString(loc)}` : '';
    return `${prefix}"${displayName}"${locLabel}`;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  makeContextInfo(dp, isOrHasAContextId) {
    const context = dp.util.asContext(isOrHasAContextId);
    if (!context) {
      return `null Context (${isOrHasAContextId})`;
    }
    const { contextId } = context;
    const { contextType, staticContextId } = context;
    const staticInfo = dp.util.makeStaticContextInfo(staticContextId, false, false);
    return `[${ExecutionContextType.nameFrom(contextType)}] #${contextId} ${staticInfo}`;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  makeStaticTraceInfo(dp, staticTraceId) {
    const fpath = dp.util.getStaticTraceProgramPath(staticTraceId);
    const st = dp.collections.staticTraces.getById(staticTraceId);
    const loc = locToString(st.loc);
    const where = `${fpath}:${loc}`;
    let displayName = st?.displayName;
    if (!displayName) {
      // if (TraceType.is.Await(st.type)) {
      //   const previousTrace = dp.callGraph.getPreviousInContext(traceId);
      //   const previousSt = previousTrace && dp.util.getStaticTrace(previousTrace.traceId);
      //   displayName = previousSt?.displayName && `(awaiting) ${previousSt.displayName}`;
      // }
    }
    if (!displayName) {
      displayName = `[${TraceType.nameFrom(st.type)}]`;
    }
    displayName = truncateStringDefault(displayName || '');
    return `"${displayName}" at ${where} (stid=${st?.staticTraceId})`;
  },

  /**
   * @param {RuntimeDataProvider} dp
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
    const { traceId, staticTraceId } = trace;
    const traceType = dp.util.getTraceType(traceId);
    const typeName = TraceType.nameFrom(traceType);
    return `[${typeName}] #${traceId} ${dp.util.makeStaticTraceInfo(staticTraceId)}`;
  },

  // ###########################################################################
  // Contexts + their traces
  // ###########################################################################

  /**
   * Whether this is the last trace we have seen in its context.
   * NOTE: Ignores final `PopImmediate`.
   * @param {RuntimeDataProvider} dp 
  */
  isLastTraceInRealContext(dp, traceId) {
    const trace = dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    return dp.util.getLastTraceInRealContext(contextId) === trace;
  },

  /**
   * Whether this is the last trace of its static context
   * NOTE: Ignores final `PopImmediate`.
   * @param {RuntimeDataProvider} dp 
  */
  isLastStaticTraceInContext(dp, staticTraceId) {
    const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = staticTrace;
    return dp.util.getLastStaticTraceInContext(staticContextId) === staticTrace;
  },

  /** @param {RuntimeDataProvider} dp */
  getActualLastTraceInRealContext(dp, contextId) {
    const traces = dp.indexes.traces.byRealContext.get(contextId);
    return traces?.[traces.length - 1] || null;
  },

  /**
   * Whether this is the last trace we have seen in its context.
   * NOTE: Ignores final `PopImmediate`.
   * @param {RuntimeDataProvider} dp 
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
   * @param {RuntimeDataProvider} dp 
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

  /** @param {RuntimeDataProvider} dp */
  getTracesOfContext(dp, contextId) {
    return dp.indexes.traces.byContext.get(contextId);
  },

  /** @param {RuntimeDataProvider} dp */
  getTracesOfContextAndType(dp, contextId, type) {
    const traces = dp.indexes.traces.byContext.get(contextId);
    // NOTE: `Await` contexts don't have traces
    // if (!traces) {
    //   dp.logger.error(`Context did not have any traces: ${contextId}`);
    // }
    return traces?.filter(trace => dp.util.getTraceType(trace.traceId) === type) || EmptyArray;
  },

  /** @param {RuntimeDataProvider} dp */
  getTracesOfRealContextAndType(dp, contextId, type) {
    const realContextId = dp.util.getRealContextIdOfContext(contextId);
    if (!realContextId) {
      return null;
    }
    return dp.util.getTracesOfContextAndType(realContextId, type);
  },

  /** @param {RuntimeDataProvider} dp */
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
   * @param {RuntimeDataProvider} dp
   */
  isContextTraced(dp, contextId) {
    const tracesDisabled = dp.util.getExecutionContext(contextId)?.tracesDisabled;
    return !tracesDisabled;
  },

  // ###########################################################################
  // graph traversal
  // ###########################################################################

  /** @param {RuntimeDataProvider} dp */
  traverseDfs(dp, contexts, dfsRecurse, preOrderCb, postOrderCb) {
    dfsRecurse = dfsRecurse || ((dfs, context, children, prev) => {
      for (const child of children) {
        dfs(child, prev);
      }
    });

    const dfs = ((context) => {
      const children = dp.util.getChildrenOfContextInRoot(context.contextId);

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

  /** @param {RuntimeDataProvider} dp */
  getChildrenOfContext(dp, contextId) {
    return dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
  },

  /** @param {RuntimeDataProvider} dp */
  getChildrenOfContextInRoot(dp, contextId) {
    return dp.util.getChildrenOfContext(contextId).filter(context => {
      if (context.isVirtualRoot) {
        // ignore separate root
        return false;
      }

      if (ExecutionContextType.is.Await(context.contextType)) {
        // ignore await contexts
        return false;
      }
      return true;
    });
  },

  /** @param {RuntimeDataProvider} dp */
  getContextAncestorCountInRoot(dp, contextId) {
    if (!dp.util.isRootContext(contextId)) {
      const { parentContextId } = dp.collections.executionContexts.getById(contextId);
      return 1 + dp.util.getContextAncestorCountInRoot(parentContextId);
    }
    return 0;
  },


  /** ###########################################################################
   * search
   *  #########################################################################*/

  /**
   * @param {RuntimeDataProvider} dp 
   * @param {string} searchTerm
   */
  searchContexts(dp, searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    return dp.util.getAllExecutedStaticContexts().
      filter(staticContext => {
        return staticContext.displayName?.toLowerCase().includes(searchTerm);
      }).
      flatMap(staticContext =>
        dp.indexes.executionContexts.byStaticContext.get(staticContext.staticContextId)
      );
  },

  /**
   * @param {RuntimeDataProvider} dp 
   * @param {string} searchTerm
   */
  searchTraces(dp, searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    return dp.util.getAllExecutedStaticContexts().
      flatMap(staticContext => {
        const staticTraces = dp.util.getExecutedStaticTracesInStaticContext(staticContext.staticContextId) || EmptyArray;
        return staticTraces.filter(staticTrace =>
          staticTrace.displayName?.toLowerCase().includes(searchTerm)
        );
      }).
      flatMap(staticTrace =>
        dp.indexes.traces.byStaticTrace.get(staticTrace.staticTraceId) || EmptyArray
      );
  },

  /**
   * @param {RuntimeDataProvider} dp 
   * @param {number|string} searchTerm
   */
  searchValues(dp, searchTerm) {
    searchTerm = searchTerm.toString().toLowerCase();

    return dp.util.getPrimitiveDataNodes()
      .filter(dataNode =>
        dataNode.value?.toString().toLowerCase().includes(searchTerm)
      );
  },

  // ###########################################################################
  // labels
  // ###########################################################################

  /** @param {RuntimeDataProvider} dp */
  makeTypeNameLabel(dp, traceId) {
    const traceType = dp.util.getTraceType(traceId);
    const typeName = TraceType.nameFrom(traceType);
    return `[${typeName}]`;
  },

  /** ###########################################################################
   * Stats
   * ##########################################################################*/

  /** @param {RuntimeDataProvider} dp */
  getTraceCountsByPackageName(dp, tracesByPackageName = {}, prop = 'nTraces') {
    dp.collections.traces.getAllActual().forEach(t => {
      const { traceId } = t;
      const packageName = dp.util.getTracePackageName(traceId);
      if (!tracesByPackageName[packageName]) {
        tracesByPackageName[packageName] = {};
      }
      tracesByPackageName[packageName][prop] = (tracesByPackageName[packageName][prop] || 0) + 1;
    });
    return tracesByPackageName;
  },

  /** @param {RuntimeDataProvider} dp */
  getTraceCountsByStaticContext(dp, tracesByStaticContext = {}, prop = 'nTraces') {
    const staticContextIds = dp.indexes.traces.byRealStaticContext.getAllKeys();
    staticContextIds.forEach(staticContextId => {
      const traces = dp.indexes.traces.byRealStaticContext.get(staticContextId);
      if (!tracesByStaticContext[staticContextId]) {
        tracesByStaticContext[staticContextId] = {
          staticContextId
        };
      }
      tracesByStaticContext[staticContextId][prop] = (tracesByStaticContext[staticContextId][prop] || 0) + traces.length;
    });
    return tracesByStaticContext;
  },

  // ###########################################################################
  // async
  // ###########################################################################

  /** 
   * @param {RuntimeDataProvider} dp
   * @return {AsyncNode}
   */
  getAsyncNode(dp, rootId) {
    return dp.indexes.asyncNodes.byRoot.getUnique(rootId);
  },


  /** @param {RuntimeDataProvider} dp */
  getAsyncRootThreadId(dp, rootId) {
    return dp.indexes.asyncNodes.byRoot.getUnique(rootId)?.threadId;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getStaticContextCallbackThreadId(dp, rootId) {
    return dp.indexes.asyncNodes.byRoot.getUnique(rootId)?.threadId;
  },

  /** 
   * @param {RuntimeDataProvider} dp
   * @return {AsyncEvent[]}
   */
  getChainFrom(dp, fromRootId) {
    const fromEdges = dp.indexes.asyncEvents.from.get(fromRootId);
    return fromEdges?.filter(edge => edge.edgeType === AsyncEdgeType.Chain) || EmptyArray;
  },

  /** @param {RuntimeDataProvider} dp */
  getChainTo(dp, toRootId) {
    const fromEdges = dp.indexes.asyncEvents.to.get(toRootId);
    return fromEdges?.filter(edge => edge.edgeType === AsyncEdgeType.Chain) || EmptyArray;
  },

  /** @param {RuntimeDataProvider} dp */
  getAsyncEdgeFromTo(dp, fromRootId, toRootId) {
    const toEdges = dp.indexes.asyncEvents.to.get(toRootId);
    return toEdges?.find(edge => edge.fromRootContextId === fromRootId) || null;
  },

  /** @param {RuntimeDataProvider} dp */
  getAsyncEdgesTo(dp, toRootId) {
    const toEdges = dp.indexes.asyncEvents.to.get(toRootId);
    return toEdges || null;
  },

  /**
   * @param {RuntimeDataProvider} dp
   */
  getAsyncRootEventType(dp, toRootId) {
    const postUpdate = dp.util.getAsyncPostEventUpdateOfRoot(toRootId);
    if (!postUpdate) {
      return AsyncEventType.None;
    }
    return getAsyncEventTypeOfAsyncEventUpdateType(postUpdate.type);
  },

  /**
   * @param {RuntimeDataProvider} dp
   * @return {AsyncEventUpdate}
   */
  getAsyncPreEventUpdateOfTrace(dp, schedulerTraceId) {
    return dp.indexes.asyncEventUpdates.byTrace.get(schedulerTraceId)?.[0];
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstAsyncPostEventUpdateOfRoot(dp, rootId) {
    return dp.indexes.asyncEventUpdates.byRoot.get(rootId)?.find(upd => isPostEventUpdate(upd.type));
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstAsyncPostEventUpdateOfTrace(dp, schedulerTraceId) {
    return dp.indexes.asyncEventUpdates.byTrace.get(schedulerTraceId)?.[1];
  },

  /** @param {RuntimeDataProvider} dp */
  getLastAsyncPostEventUpdateOfTrace(dp, schedulerTraceId, beforeRootId) {
    const updates = dp.indexes.asyncEventUpdates.byTrace.get(schedulerTraceId);
    return findLast(updates, upd => upd.rootId < beforeRootId && isPostEventUpdate(upd.type));
  },

  /** @param {RuntimeDataProvider} dp */
  getLastAsyncPostEventUpdateOfPromise(dp, promiseId, beforeRootId) {
    const updates = dp.indexes.asyncEventUpdates.byPromise.get(promiseId);
    return findLast(updates, upd => isPostEventUpdate(upd.type) && upd.rootId < beforeRootId);
  },

  /** 
   * Two possible scenarios for updates with `nestedPromiseId`:
   * 1. PreAwait or
   * 2. PostThen
   * 
   * @param {RuntimeDataProvider} dp
   */
  getFirstUpdateOfNestedPromise(dp, nestedPromiseId) {
    const updates = dp.indexes.asyncEventUpdates.byNestedPromise.get(nestedPromiseId);
    return updates?.[0];
  },

  /** @param {RuntimeDataProvider} dp */
  getFirstPreThenUpdateOfPromise(dp, promiseId) {
    const updates = dp.indexes.asyncEventUpdates.byPromise.get(promiseId);
    return updates?.find(upd => AsyncEventUpdateType.is.PreThen(upd.type)) || null;
  },

  /** 
   * Get the last "Post" asyncEvent of given `schedulerTraceId`.
   * That update must have `rootId` < `beforeRootId`.
   * 
   * @param {RuntimeDataProvider} dp
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
   * @return {AsyncEventUpdate}
   */
  getAsyncPostEventUpdateOfRoot(dp, rootId) {
    const updates = dp.indexes.asyncEventUpdates.byRoot.get(rootId);
    return updates?.find(upd => isPostEventUpdate(upd.type)) || null;
  },

  /**
   * @return {}
   */
  getAsyncFunctionCallerPromiseId(dp, realContextId) {
    const context = dp.collections.executionContexts.getById(realContextId);
    return context?.data?.callerPromiseId;
  },

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
   * @param {RuntimeDataProvider} dp
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


  /** @param {RuntimeDataProvider} dp */
  getAsyncStackContexts(dp, traceId) {
    const roots = [];
    const visited = new Set();
    // // skip first virtual context
    // const realContextId = dp.util.getRealContextIdOfTrace(traceId);
    // let currentContext = dp.collections.executionContexts.getById(realContextId);
    let currentContext = dp.util.getTraceContext(traceId);
    while (currentContext) {
      visited.add(currentContext);
      roots.push(currentContext);
      currentContext = dp.util.getContextAsyncStackParent(currentContext.contextId);
      if (visited.has(currentContext)) {
        dp.logger.error(`[getAsyncStackContexts] infinite loop when finding async stack contexts.
        current:
          ${dp.util.makeContextInfo(currentContext)}
        stack:
${roots.map(c => `          ${dp.util.makeContextInfo(c)}`).join('\n')}`);
        break;
      }
    }
    roots.reverse();
    return roots;
  },

  /**
   * @param {RuntimeDataProvider} dp
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

  /** @param {RuntimeDataProvider} dp */
  isAsyncNodeTerminalNode(dp, asyncNodeId) {
    const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
    const preEventUpdates = dp.util.getAsyncPreEventUpdatesOfRoot(asyncNode.rootContextId);
    return !preEventUpdates.length;
  },

  /** 
   * @param {RuntimeDataProvider} dp
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

      // handle special Promisify synchronization
      for (const p of postUpdateData.syncPromiseIds) {
        const link = dp.indexes.promiseLinks.to.getUnique(p);
        if (link && link.type === PromiseLinkType.PromisifyResolve && !roots.includes(link.rootId)) {
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
   * Special promise getters.
   *  #########################################################################*/

  /** @param {RuntimeDataProvider} dp */
  getPromiseCreationRootId(dp, promiseId) {
    const firstTraceOfPromise = dp.util.getFirstTraceByRefId(promiseId);
    return firstTraceOfPromise?.rootContextId || 0;
  },

  /** @param {RuntimeDataProvider} dp */
  getPromiseCreationRoot(dp, promiseId) {
    const rootId = dp.util.getPromiseCreationRootId(promiseId);
    return rootId && dp.collections.executionContexts.getById(rootId) || null;
  },

  /** @param {RuntimeDataProvider} dp */
  getPromiseCreationContextId(dp, promiseId) {
    const firstTraceOfPromise = dp.util.getFirstTraceByRefId(promiseId);
    return firstTraceOfPromise?.contextId || 0;
  },

  /** @param {RuntimeDataProvider} dp */
  getPromiseCreationContext(dp, promiseId) {
    const rootId = dp.util.getPromiseCreationContextId(promiseId);
    return rootId && dp.collections.executionContexts.getById(rootId) || null;
  },

  /** ###########################################################################
   * UP + DOWN
   *  #########################################################################*/

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
   * @param {RuntimeDataProvider} dp
   */
  UP(dp, nestedPromiseId, beforeRootId, nestingUpdates) {
    // -- 4 caller cases (CC), operating on `q* = nestedPromise` --
    // CC1: PostAwait: `q1 = f()` (firstAwait inside f) [q1 always new]
    // CC2: PostThen: `q2 = p.then(h)` (PostUpdate inside h) [q2 always old]
    // CC3: an outer linked promise `q3`, nesting either `q1`, `q2` or `q4`
    // CC4: a chained promise `q4 = q.then(i)` [has not settled yet]

    // NOTE: None of the promises q* have settled yet (since `q` only now settled).

    let u;

    const nestingLink = dp.indexes.promiseLinks.from.getFirst(nestedPromiseId);
    if (nestingLink) {
      const { to: outerPromiseId/* , rootId */ } = nestingLink;
      if ((u = dp.util.getLastAsyncPostEventUpdateOfPromise(outerPromiseId, beforeRootId))) {
        // “Nested PostThen” or “AsyncReturn” (of function with `PostAwait`, i.e. `await` executed)
        // nestingUpdates.push({ updateId: u.updateId, linkId: nestingLink.linkId });
        nestingUpdates.push(u.updateId);
        return u.rootId;
      }
      // “resolve” or “all” or “AsyncReturn” (of function where no `await` executed)
      // nestingUpdates.push({ linkId: nestingLink.linkId });
      return outerPromiseId && dp.util.UP(outerPromiseId, beforeRootId, nestingUpdates) || 0;
    }
    else if ((u = dp.util.getFirstUpdateOfNestedPromise(nestedPromiseId)) && u.rootId < beforeRootId) {
      // u is PreAwait && PostAwait has not happened yet: `await nestedPromise`
      // NOTE: This is guaranteed to be PreAwait, not PreThen
      //    -> because "Nested PostThen" has a `nestingLink`, and thus would go down previous branch
      const promiseRootId = dp.util.getPromiseCreationRootId(nestedPromiseId);
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
      // promise is not nested but was THEN’ed
      //  -> follow down the THEN chain (until we find a promise that is nested)
      return dp.util.UP(u.postEventPromiseId, beforeRootId, nestingUpdates);
    }
    else {
      // NOTE: we are doing this via the new PromisifyPromise link
      // // no link, and no update found -> check if this promise was created from within a promise ctor
      // // const promisifyPromiseId = dp.util.get TODO nestingPromiseId;
      // const rootContext = dp.util.getPromiseCreationContext(nestedPromiseId);
      // if (rootContext?.data?.promisifyId) {
      //   if (nestedPromiseId === rootContext.data?.promisifyId) {
      //     warn(`unexpected - Promise nesting itself: ${nestedPromiseId}`);
      //   }
      //   else {
      //     // hackfix: prevent inf loop
      //     return dp.util.UP(rootContext.data?.promisifyId, beforeRootId, nestingUpdates);
      //   }
      // }
    }

    // -> nestedPromiseId is nested but there is no relevant Post event to CHAIN from, return 0
    return 0;
  },

  /** 
   * Similar to `util.UP`, but collects all, not just the first, nesting AEs.
   * NOTE: instead of only using `scheduler` information, it also considers promise links
   * and ignored SYNC conditions.
   * @param {RuntimeDataProvider} dp
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
      const promiseRootId = dp.util.getPromiseCreationRootId(nestedPromiseId);
      if (promiseRootId < u.rootId) {
        return nestedPromiseId; // SYNC
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

  /** @param {RuntimeDataProvider} dp */
  getNestedAncestors(dp, rootId) {
    try {
      const asyncNode = dp.util.getAsyncNode(rootId);
      if (!asyncNode._nestedAncestors) {
        asyncNode._nestedAncestors = dp.util._getNestedAncestors(rootId);
      }
      return asyncNode._nestedAncestors;
    }
    catch (err) {
      logError(`Unable to getNestedAncestors for rootId=${rootId}`, err);
      return [];
    }
  },

  /** 
   * TODO: [performance] cache this recursive result
   * NOTE: Wrapper of `util.getNestedAncestorsOfPromise` for context version
   * @param {RuntimeDataProvider} dp
   * @param {Set} visited Used to avoid infinite loops.
   */
  _getNestedAncestors(dp, rootId, nestingTraces = [], visited = new Set()) {
    const u = dp.util.getAsyncPostEventUpdateOfRoot(rootId);
    if (!u) {
      return nestingTraces;
    }

    let nextPromiseId = u.promiseId, nextRootId, nextTraceId;
    if (nextPromiseId) {
      if (visited.has(nextPromiseId)) {
        // NOTE: worth warning about
        // TODO: need a more complete approach here, to avoid spamming, and to help the user better.
        // if (!_warnPromiseSet.has) { ... }
        // TODO: add `makePromiseInfo` utility function
        dp.logger.warn(`Never-ending promise found. Promise dynamically nested upon itself: v${nextPromiseId} at root c${rootId}`);
      }
      else {
        visited.add(nextPromiseId);
        const nextNextPromiseId = dp.util.getNestedAncestorsOfPromise(nextPromiseId, rootId, nestingTraces);
        const nextTrace = nextNextPromiseId && dp.util.getFirstTraceByRefId(nextNextPromiseId);
        nextTraceId = nextTrace?.traceId;
        nextRootId = nextTrace?.rootContextId;
      }
    }

    if (!nextRootId) {
      const fromEdge = dp.indexes.asyncEvents.to.getUnique(u.rootId);
      nextTraceId = u.schedulerTraceId;
      nextRootId = fromEdge?.fromRootContextId;
    }

    if (nextTraceId) {
      nestingTraces.push(nextTraceId);
    }

    if (nextRootId) {
      dp.util._getNestedAncestors(nextRootId, nestingTraces, visited);
    }

    return nestingTraces;
  },

  /** 
   * @param {RuntimeDataProvider} dp
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
   * @param {RuntimeDataProvider} dp
   * @param {PostUpdateData} postUpdateData
   */
  GNPU(dp, nestingPromiseId, beforeRootId, syncBeforeRootId, postUpdateData, depth = 0, visited = new Set()) {
    if (!nestingPromiseId || visited.has(nestingPromiseId)) {
      return null;
    }
    visited.add(nestingPromiseId);
    const { links, syncPromiseIds } = postUpdateData;

    const promiseRootId = dp.util.getPromiseCreationRootId(nestingPromiseId);
    let nestedUpdate = dp.util.getLastAsyncPostEventUpdateOfPromise(nestingPromiseId, beforeRootId);

    // SYNC if: (i) promise was created in a root BEFORE the NESTING happened, or
    //          (ii) someone else already CHAINED against it.
    if (promiseRootId < syncBeforeRootId) {
      // potentially nested for synchronization -> do not go deeper
      // const chainFrom = dp.util.getChainFrom(nestedUpdate.rootId); // store for debugging
      // TODO: fix (async-thencb1.js)
      syncPromiseIds.push(nestingPromiseId);
      // log(`SYNC`, postUpdateData, nestingPromiseId);
      return null;
    }
    else {
      // Cases for nesting:

      // * nestedUpdate(u) can be {PostAwait,PostThen,PostCallback}
      // * nestedLink(link) can be {AsyncReturn,ThenNested,Resolve,All,Promisify}

      // Case 1:  p nests shallow link     -> !u && link (Resolve,All,Race,PromisifiedPromise)
      // Case 2a: p nests u (PostAwait)    -> u && !link
      // Case 2b: p nests u (PostAwait)    -> u && link (AsyncReturn) [can be BOTH]
      // Case 3a: p nests u (PostThen)     -> u && !link
      // Case 3b: p nests u (PostThen)     -> u && link (ThenNested) [can be BOTH]
      // Case 4a: p nests u (PostCallback) -> u && !link 
      // Case 4a: p nests u (PostCallback) -> u && link (Promisify) [can only be either SYNC or CHAIN]

      // TODO: in case of PromisifyPromise, we might have multiple links.
      //    -> only get the unchained ones
      // TODO: also, one of the links could be PromisifyResolve, which would currently be resolved incorrectly
      //    -> in this case, try CHAIN against the inner promise that owns the root where resolve is called
      //      -> only do that if its not a SYNC
      //    -> see promisify-promise2.js
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
          // NOTE: we somehow use PromiseLinkType.Promisify* to set `promiseId` on the PostCallbackUpdate instead.
          //  → This means that non-CB links cannot be traced like that.
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

        if (!nestedUpdate) {
          // check promisification special cases
          if (!nestedLink) {
            // NOTE: this part is now done via PromiseLink.PromisifiedPromise
            //   const rootContext = dp.util.getPromiseCreationContext(nestedPromiseId);
            //   if (rootContext?.promisifyId) {
            //     if (nestedPromiseId === rootContext.promisifyId) {
            //       warn(`unexpected - Promise nesting itself: ${nestedPromiseId}`);
            //     }
            //   }
          }
          else if (nestedLink.asyncPromisifyPromiseId && nestedLink.rootId) {
            // Promise ctor's resolve was called while this AE was waiting for it.
            //    -> `nestedLink.rootId` implies that it was attached to a root.
            //    -> `!nestedUpdate` implies that resolve was called outside of a promisified callback.
            //        -> means it was called by a root outside this AE's own thread.
            syncPromiseIds.push(nestingPromiseId);
            return null;
          }
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

  /** @param {RuntimeDataProvider} dp */
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

  /** @param {RuntimeDataProvider} dp */
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

    const isFirstAwait = util.isFirstAwait(preEventContextId);

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
   * @param {RuntimeDataProvider} dp
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
   * @param {RuntimeDataProvider} dp
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

    // NOTE: `nestingPostUpdate` is the PostEventUpdate of preEventUpdate -> the Update that creates the promise
    // const nestingPostUpdate = util.getAsyncPostEventUpdateOfRoot(preEventRootId);
    // const nestingPromiseId = nestingPostUpdate.promiseId;
    const firstPostEventHandlerUpdate = util.getFirstAsyncPostEventUpdateOfTrace(schedulerTraceId);

    let promisePostUpdateData;

    // if (preEventRootId === 1) {
    //   // Case 1: don't CHAIN cb from first root
    //   //      (TODO: top-level `await` would CHAIN from first root.)
    // }
    // else 
    const syncPromiseIds = [];
    const nestingUpdates = [];
    if (preEventPromiseId/*  || nestingPromiseId */) {
      // Case 1: Promisification
      chainToPromiseId = preEventPromiseId;
      const toRootId = postEventRootId;

      const links = [];
      promisePostUpdateData = {
        toRootId,
        preEventUpdate,
        links,
        syncPromiseIds,
        nestingUpdates
      };
      // const syncBeforeRootId = preEventRootId;

      /**
       * 
       */
      // const syncBeforeRootId = nestingPostUpdate.rootId;

      const lastOfPromise = dp.util.getLastAsyncPostEventUpdateOfPromise(preEventPromiseId, beforeRootId);
      rootIdDown = lastOfPromise?.rootId || 0;
      // rootIdDown = lastOfPromise?.rootId ||  // NOTE: this was the old, flawed logic, before we had all links working.
      //   nestingPromiseId &&
      //   util.DOWN(nestingPromiseId, beforeRootId, syncBeforeRootId, promisePostUpdateData) ||
      //   0;
      rootIdUp = util.UP(chainToPromiseId, beforeRootId, nestingUpdates);

      nestingUpdates.push(preEventUpdate.updateId); // PostCallback always adds its own scheduler as a nesting level

      // go up the promise chain
      chainFromRootId = rootIdDown || rootIdUp;
    }
    else {
      // Case 2: CALLBACK_CHAIN_HEURISTICS
      if (firstPostEventHandlerUpdate && firstPostEventHandlerUpdate.rootId < beforeRootId) {
        // Heuristic 1: event listener -> repeated calls of same scheduler trace
        // chainFromRootId = firstPostEventHandlerUpdate.rootId;
        chainFromRootId = dp.util.getLastAsyncPostEventUpdateOfTrace(schedulerTraceId, beforeRootId)?.rootId ||
          firstPostEventHandlerUpdate.rootId;
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

  /** @param {RuntimeDataProvider} dp */
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

  /** @param {RuntimeDataProvider} dp */
  getTraceOfAsyncNode(dp, asyncNodeId) {
    const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
    const firstTrace = dp.indexes.traces.byContext.getFirst(asyncNode.rootContextId);
    return firstTrace;
  },

  /** @param {RuntimeDataProvider} dp */
  getAsyncParent(dp, asyncNodeId) {
    const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
    const parentEdge = dp.indexes.asyncEvents.to.getFirst(asyncNode.rootContextId);
    const parentRootContextId = parentEdge?.fromRootContextId;
    const parentAsyncNode = dp.indexes.asyncNodes.byRoot.getUnique(parentRootContextId);
    return parentAsyncNode;
  },
};

export default dataProviderUtil;
