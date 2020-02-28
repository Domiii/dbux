import { newLogger } from 'dbux-common/src/log/logger';
import Trace from 'dbux-common/src/core/data/Trace';
import DataProvider from 'dbux-data/src/DataProvider';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';
import allApplications from 'dbux-data/src/applications/allApplications';
import CallStackNode, { EmptyNode, BarrierNode } from './CallStackNode';
import TraceType from 'dbux-common/src/core/constants/TraceType';

const { log, debug, warn, error: logError } = newLogger('CallStackNodeProvider');

export class CallStackNodeProvider {
  _allNodes: Array<CallStackNode>;

  constructor(callStackViewController) {
    this.view = callStackViewController;
    this.onDidChangeTreeData = callStackViewController.onChangeEventEmitter.event;
    this._allNodes = [];

    traceSelection.onTraceSelectionChanged(this.update);
  }

  // ########################################
  // Public methods
  // ########################################

  update = (trace, sender) => {
    if (sender === 'callStackViewController') return;
    if (!trace) {
      this._allNodes = [];
    }
    else this._allNodes = this._getCallStackOfTrace(trace);
    this.refresh();
  }

  showParent = (node) => {
    this._changeSearchModeOfNode(node, 'parent');
    this.refresh();
  }

  showScheduler = (node) => {
    this._changeSearchModeOfNode(node, 'scheduler');
    this.refresh();
  }

  refresh = () => {
    this.view.refresh();
  }

  // ########################################
  // Private methods
  // ########################################

  _changeSearchModeOfNode(node, searchMode) {
    let callStack = [];
    for (let i = 0; this._allNodes[i] !== node; i++) {
      callStack.push(this._allNodes[i]);
    }
    node.searchMode = searchMode;
    const nextNode = this._getNextNode(node);
    const newNodes = this._getCallStackOfTrace(nextNode.trace);
    this._allNodes = [...callStack, node, ...newNodes];
  }

  _getNextNode(node) {
    const { trace, searchMode } = node;
    const nextTraceId = this._findNextTraceId(trace, searchMode);
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const nextTrace = dp.collections.traces.getById(nextTraceId);
    if (nextTrace) return this._createNodeByTrace(nextTrace);
    else return null;
  }

  _getCallStackOfTrace(trace) {
    let currentNode: CallStackNode;
    let nextNode: CallStackNode;
    let callStack = [];
    let lastRunId = null;
    nextNode = this._createNodeByTrace(trace);

    while (nextNode) {
      currentNode = nextNode;
      if (lastRunId && nextNode.trace.runId !== lastRunId) {
        callStack.push(BarrierNode);
      }
      lastRunId = nextNode.trace.runId;
      callStack.push(currentNode);

      nextNode = this._getNextNode(currentNode);
    }
    return callStack;
  }

  // ########################################
  // Util
  // ########################################

  // TODO: Move Node building logic to CallStackNode
  /**
   * Only specify the searchMode while it's available.
   * @param {Trace} trace
   */
  _createNodeByTrace = (trace, specifiedSearchMode = null) => {
    const { traceId, staticTraceId, applicationId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;
    const label = makeTraceLabel(trace);

    const context = this._getContextByTrace(trace);
    const app = allApplications.getById(applicationId);
    const contextLabel = makeContextLabel(context, app);
    const fileName = dp.util.getTraceFileName(traceId);
    const { loc } = dp.collections.staticTraces.getById(staticTraceId);
    const { line, column } = loc.start;
    const description = `${contextLabel} @${fileName}:${line}:${column}`;
    const parentStatus = this._getParentStatus(trace);
    
    let searchMode;
    if (specifiedSearchMode) {
      searchMode = specifiedSearchMode;
    }
    else if (parentStatus === 'schedulerOnly') {
      searchMode = 'scheduler';
    }
    else {
      searchMode = 'parent';
    }

    const newNode = new CallStackNode(
      label,
      description,
      applicationId,
      trace,
      searchMode,
      parentStatus,
      this
    );

    return newNode;
  }

  /**
   * @param {Trace} trace 
   */
  _findNextTraceId(trace, searchMode) {
    const dp = allApplications.getById(trace.applicationId).dataProvider;
    const { contextId } = trace;
    if (searchMode === 'parent') {
      const nextTrace = dp.callGraph.getPreviousParentContext(trace.traceId);
      if (!nextTrace) {
        return null;
      }
      return nextTrace.callId || nextTrace.traceId;

      // if (trace.type === TraceType.PushCallback || trace.type === TraceType.PopCallback) {
      //   // temporarily solve callstack of callback
      //   // TODO: fit new callback structure
      //   const nextTrace = dp.callGraph.getPreviousParentContext(trace.traceId);
      //   if (trace.parnetContextId === nextTrace.parentContextId) {
      //     return dp.callGraph.getPreviousParentContext(nextTrace.traceId).traceId;
      //   }
      //   else return nextTrace.traceId;
      // }
      // else {
      //   const nextTraceId = dp.util.getFirstTraceOfContext(contextId).traceId - 1;
      //   const nextTrace = dp.collections.traces.getById(nextTraceId);
      //   if (!nextTrace) return null;
      //   return nextTrace.callId || nextTraceId;
      // }
    }
    if (searchMode === 'scheduler') {
      const context = dp.collections.executionContexts.getById(contextId);
      const { schedulerTraceId } = context;
      return schedulerTraceId;
    }
    logError('searchMode must be \'parent\' or \'scheduler\'');
    return null;
  }

  _getParentStatus(trace) {
    const { parentContextId, schedulerTraceId } = this._getContextByTrace(trace);
    if (parentContextId) {
      if (schedulerTraceId) return 'both';
      return 'parentOnly';
    }
    else {
      if (schedulerTraceId) return 'schedulerOnly';
      return 'none';
    }
  }

  /**
   * @param {Trace} trace 
   */
  _getContextByTrace(trace) {
    const { dataProvider } = allApplications.getById(trace.applicationId);
    return dataProvider.collections.executionContexts.getById(trace.contextId);
  }

  // ########################################
  // TreeDataProvider methods
  // ########################################

  /**
   * @param {CallStackNode} node
   */
  getTreeItem(node) {
    return node;
  }

  /**
   * @param {CallStackNode} node
   */
  getChildren(node) {
    if (node) {
      return node.children;
    }
    else {
      if (this._allNodes.length) return this._allNodes;
      return [EmptyNode];
    }
  }

  /**
   * @param {CallStackNode} node
   */
  getParent(node) {
    return node.parentNode;
  }
}