import ExecutionContextType from '@dbux/common/src/types/constants/ExecutionContextType';
import { makeStructuredRandomColor } from '@dbux/graph-common/src/shared/contextUtil';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { makeTraceValueLabel, makeTraceLabel, makeContextLocLabel, makeTraceLocLabel, makeContextLabel, makeContextCallerLabel } from '@dbux/data/src/helpers/makeLabels';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

/** @typedef { import("@dbux/data/src/RuntimeDataProvider").default } RuntimeDataProvider */

/**
 * @param {{ applicationId, contextId }} applicationIdHolder 
 * @return {RuntimeDataProvider}
 */
function getDp(applicationIdHolder) {
  return allApplications.getById(applicationIdHolder.applicationId).dataProvider;
}

class ContextNode extends HostComponentEndpoint {
  get debugTag() {
    const dp = getDp(this.state.context);
    return `[${this.componentName}: ${dp.util.makeContextInfo(this.state.context)}]`;
    // return super.debugTag;
  }

  init() {
    this.childrenBuilt = false;
    this.state.visible = this.hiddenNodeManager ? this.hiddenNodeManager.shouldBeVisible(this) : true;

    const {
      /**
       * @type {ExecutionContext}
       */
      context
    } = this.state;

    const { applicationId, contextId } = context;
    const app = allApplications.getById(applicationId);
    const dp = app.dataProvider;

    this.state.hasError = !!dp.indexes.traces.errorByContext.get(contextId)?.length;
    this.state.rootContextId = dp.util.getRootContextOfContext(contextId).contextId;

    this.setNodeState();

    // add controllers
    let hasChildren = !!this.getActualChildContexts().length;
    this.controllers.createComponent('GraphNode', { hasChildren });
    this.controllers.createComponent('PopperController');
    this.controllers.createComponent('Highlighter');
  }

  update() {
    this._addStats(this.state);
  }

  /**
   * @virtual
   */
  setNodeState() {
    const {
      context
    } = this.state;
    const {
      screenshotMode,
      themeMode
    } = this.context;
    const { applicationId, contextId } = context;
    const app = allApplications.getById(applicationId);
    const dp = app.dataProvider;

    this.state.contextLabel = makeContextLabel(context, app);
    const packageName = this.state.packageName = dp.util.getContextPackageName(contextId);
    this.state.contextLocLabel = makeContextLocLabel(applicationId, context);
    const { callTrace } = this;
    if (callTrace) {
      this.state.callerTracelabel = dp.util.makeContextCallerOrSchedulerLabel(contextId);
      this.state.valueLabel = makeTraceValueLabel(callTrace);
    }

    const realStaticContextid = dp.util.getRealContextOfContext(contextId).staticContextId;
    this.state.backgroundStyle = makeStructuredRandomColor(themeMode, realStaticContextid, {
      bland: !!packageName,
      highContrastMode: screenshotMode
    });
  }

  // ########################################
  // getters
  // ########################################

  get dp() {
    const { applicationId } = this.state.context;
    return allApplications.getById(applicationId).dataProvider;
  }

  get contextId() {
    const { context: { contextId } } = this.state;
    return contextId;
  }

  get firstTrace() {
    return this.dp.util.getFirstTraceOfContext(this.contextId);
  }

  get callTrace() {
    return this.dp.util.getCallerOrSchedulerTraceOfFirstContext(this.contextId);
  }

  get allContextStats() {
    return this.dp.queries.statsByContext(this.contextId);
  }

  get hiddenNodeManager() {
    return this.context.graphRoot.controllers.getComponent('HiddenNodeManager');
  }

  // ########################################
  // stats
  // ########################################

  get nTreeContexts() {
    const stats = this.allContextStats;
    return stats?.nTreeContexts || 0;
  }

  get nTreeStaticContexts() {
    const stats = this.allContextStats;
    return stats?.nTreeStaticContexts || 0;
  }

  //get amount of file call
  get nTreeFileCalled() {
    const state = this.allContextStats;
    return state?.nTreeFileCalled || 0;
  }

  get nTreeTraces() {
    const stats = this.allContextStats;
    return stats?.nTreeTraces || 0;
  }

  _addStats(_update) {
    const stats = this.allContextStats;
    _update.nTreeFileCalled = stats.nTreeFileCalled;
    _update.nTreeStaticContexts = stats.nTreeStaticContexts;
    _update.nTreeContexts = stats.nTreeContexts;
    _update.nTreeTraces = stats.nTreeTraces;
    _update.nTreePackages = stats.nTreePackages;
  }

  // ########################################
  // children
  // ########################################

  /**
   * @virtual
   * @return {ExecutionContext[]}
   */
  getAllChildContexts() {
    const dp = getDp(this.state.context);
    return dp.util.getChildrenOfContext(this.state.context.contextId) || EmptyArray;
  }

  /**
   * Filters out contexts not to be added as children to the SCG's node representation of the context.
   * 
   * @return {ExecutionContext[]}
   */
  getActualChildContexts() {
    const childContexts = this.getAllChildContexts();
    const dp = getDp(this.state.context);
    return childContexts.filter(childContext => {
      if (dp.util.isRootContext(childContext.contextId)) {
        return false;
      }

      if (ExecutionContextType.is.Await(childContext.contextType)) {
        return false;
      }

      return true;
    });
  }

  // ########################################
  // focus
  // ########################################

  async reveal(expandItself = false) {
    const graphNode = this.controllers.getComponent('GraphNode');
    if (!graphNode) {
      this.logger.trace(`reveal failed because ContextNode is missing GraphNode: cid=${this.contextId} (${this.state.contextLabel})`);
    }
    else {
      await graphNode.reveal(expandItself);
    }
  }

  expand() {
    if (this.controllers.getComponent('GraphNode').state.mode === GraphNodeMode.Collapsed) {
      this.controllers.getComponent('GraphNode').setMode(GraphNodeMode.ExpandChildren);
    }
  }

  getChildrenCount() {
    return this.getActualChildContexts().length;
  }

  getSubGraphChildrenCount() {
    return this.nTreeContexts;
  }

  setSelected(isSelected) {
    const selectedTrace = traceSelection.selected;
    let traceId = null;
    let isSelectedTraceCallRelated = false;
    let contextIdOfSelectedCallTrace = null;
    // if selected trace is call related, returns the contextId of this call
    if (selectedTrace) {
      ({ traceId } = selectedTrace);
      const { applicationId } = selectedTrace;
      const dp = allApplications.getById(applicationId).dataProvider;
      const callId = dp.util.getBCETraceOfTrace(traceId)?.traceId;
      const calledContext = callId && dp.util.getCalledContext(callId) || null;
      isSelectedTraceCallRelated = !!callId;
      contextIdOfSelectedCallTrace = calledContext?.contextId;
    }
    if (isSelected) {
      this.expand();
    }
    this.setState({ isSelected, traceId, isSelectedTraceCallRelated, contextIdOfSelectedCallTrace });
  }

  hiddenByNode() {
    return this.hiddenNodeManager?.getHiddenNodeHidingThis(this);
  }

  public = {
    selectFirstTrace() {
      const { firstTrace } = this;
      if (firstTrace) {
        traceSelection.selectTrace(firstTrace);
        this.componentManager.externals.emitCallGraphTraceAction(firstTrace, UserActionType.CallGraphTrace);
      }
      else {
        this.componentManager.externals.alert('Cannot find any trace of this context.', false);
      }
    },
    selectCallTrace() {
      const { callTrace } = this;
      if (callTrace) {
        traceSelection.selectTrace(callTrace);
        this.componentManager.externals.emitCallGraphTraceAction(callTrace, UserActionType.CallGraphCallTrace);
      }
    },
    // toggleStaticContextHighlight() {
    //   const { applicationId, context: { staticContextId } } = this.state;
    //   const contextNodeManager = this.context.graphRoot.controllers.getComponent('ContextNodeManager');
    //   contextNodeManager.toggleStaticContextHighlight({ applicationId, staticContextId });
    // },
    // async selectPreviousContextByStaticContext() {
    //   const { applicationId, context } = this.state;
    //   const dp = allApplications.getById(applicationId).dataProvider;
    //   const contexts = dp.indexes.executionContexts.byStaticContext.get(context.staticContextId) || EmptyArray;
    //   const index = binarySearchByKey(contexts, context, (x) => x.contextId);
    //   if (index !== 0) {
    //     const { contextId } = contexts[index - 1];
    //     await this.context.graphRoot.focusContext(applicationId, contextId);
    //   }
    //   else {
    //     this.componentManager.externals.alert('This is the first context of staticContext', false);
    //   }
    // },
    // async selectNextContextByStaticContext() {
    //   const { applicationId, context } = this.state;
    //   const dp = allApplications.getById(applicationId).dataProvider;
    //   const contexts = dp.indexes.executionContexts.byStaticContext.get(context.staticContextId) || EmptyArray;
    //   const index = binarySearchByKey(contexts, context, (x) => x.contextId);
    //   if (index !== contexts.length - 1) {
    //     const { contextId } = contexts[index + 1];
    //     await this.context.graphRoot.focusContext(applicationId, contextId);
    //   }
    //   else {
    //     this.componentManager.externals.alert('This is the last context of staticContext', false);
    //   }
    // }
  }
}

export default ContextNode;