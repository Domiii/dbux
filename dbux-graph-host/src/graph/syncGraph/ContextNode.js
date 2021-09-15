import ExecutionContextType from '@dbux/common/src/types/constants/ExecutionContextType';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { makeTraceValueLabel, makeTraceLabel, makeContextLocLabel, makeTraceLocLabel, makeContextLabel, makeContextCallerLabel } from '@dbux/data/src/helpers/makeLabels';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

class ContextNode extends HostComponentEndpoint {
  init() {
    this.childrenBuilt = false;
    this.state.statsEnabled = true;

    const {
      applicationId,
      context,
      statsEnabled
    } = this.state;

    const { contextId } = context;

    // get name (and other needed data)
    const app = allApplications.getById(applicationId);
    const dp = app.dataProvider;
    const errorTag = (dp.indexes.traces.errorByContext.get(contextId)?.length) ? '🔥' : '';

    this.state.contextLabel = makeContextLabel(context, app) + errorTag;
    this.state.contextLocLabel = makeContextLocLabel(applicationId, context);
    const { callTrace } = this;
    this.state.callerTracelabel = dp.util.makeContextCallerOrSchedulerLabel(contextId);
    if (callTrace) {
      this.state.valueLabel = makeTraceValueLabel(callTrace);
    }
    this.state.moduleName = dp.util.getContextModuleName(contextId);

    if (statsEnabled) {
      this._addStats(this.state);
    }

    // add controllers
    let hasChildren = !!this.getValidChildContexts().length;
    this.controllers.createComponent('GraphNode', { hasChildren });
    this.controllers.createComponent('PopperController');
    this.controllers.createComponent('Highlighter');
  }

  // ########################################
  // getters
  // ########################################

  get dp() {
    const { applicationId } = this.state;
    const { dataProvider } = allApplications.getById(applicationId);
    return dataProvider;
  }

  get contextId() {
    const { context: { contextId } } = this.state;
    return contextId;
  }

  get firstTrace() {
    return this.dp.util.getFirstTraceOfContext(this.contextId);
  }

  get callTrace() {
    return this.dp.util.getCallerOrSchedulerTraceOfContext(this.contextId);
  }

  get nTreeContexts() {
    const stats = this.dp.queries.statsByContext(this.contextId);
    return stats?.nTreeContexts || 0;
  }

  get nTreeStaticContexts() {
    const stats = this.dp.queries.statsByContext(this.contextId);
    return stats?.nTreeStaticContexts || 0;
  }

  //get amount of file call
  get nTreeFileCalled() {
    const state = this.dp.queries.statsByContext(this.contextId);
    return state?.nTreeFileCalled || 0;
  }

  // ########################################
  // stats
  // ########################################

  setStatsEnabled(enabled) {
    const upd = {
      statsEnabled: enabled
    };
    if (enabled) {
      this._addStats(upd);
    }
    this.setState(upd);
  }

  _addStats(_update) {
    _update.nTreeContexts = this.nTreeContexts;
    _update.nTreeStaticContexts = this.nTreeStaticContexts;
    //nTreeFileCalled
    _update.nTreeFileCalled = this.nTreeFileCalled;
  }

  // ########################################
  // children
  // ########################################

  getValidChildContexts() {
    const { applicationId, context: { contextId } } = this.state;
    const dp = allApplications.getById(applicationId).dataProvider;
    const childContexts = dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
    return childContexts.filter(childContext => {
      if (dp.util.isRootContext(childContext.contextId)) {
        // TODO-m: check in graph root instead
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
    this.controllers.getComponent('GraphNode').setMode(GraphNodeMode.ExpandChildren);
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
    return this.context.runNode.hiddenByNode();
  }

  public = {
    selectFirstTrace() {
      const { firstTrace } = this;
      if (firstTrace) {
        this.componentManager.externals.emitCallGraphAction(UserActionType.CallGraphTrace, { trace: firstTrace });
        traceSelection.selectTrace(firstTrace);
      }
      else {
        this.componentManager.externals.alert('Cannot find any trace of this context.', false);
      }
    },
    selectCallTrace() {
      const { callTrace } = this;
      if (callTrace) {
        this.componentManager.externals.emitCallGraphAction(UserActionType.CallGraphCallTrace, { trace: callTrace });
        traceSelection.selectTrace(callTrace);
      }
    },
    // toggleStaticContextHighlight() {
    //   const { applicationId, context: { staticContextId } } = this.state;
    //   const contextNodeManager = this.context.graphRoot.controllers.getComponent('ContextNodeManager');
    //   contextNodeManager.toggleStaticContextHighlight(applicationId, staticContextId);
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