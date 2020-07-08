import { binarySearchByKey } from 'dbux-common/src/util/arrayUtil';
import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import { makeTraceValueLabel, makeTraceLabel, makeContextLocLabel, makeTraceLocLabel } from 'dbux-data/src/helpers/traceLabels';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class ContextNode extends HostComponentEndpoint {
  init() {
    const {
      applicationId,
      context
    } = this.state;

    // get name (and other needed data)
    const dp = allApplications.getById(applicationId).dataProvider;
    const staticContext = dp.collections.staticContexts.getById(context.staticContextId);
    const errorTag = (dp.indexes.traces.errorByContext.get(context.contextId)?.length) ? '🔥' : '';
    this.parentTrace = dp.util.getCallerTraceOfContext(context.contextId);

    this.state.contextNameLabel = staticContext.displayName + errorTag;
    this.state.contextLocLabel = makeContextLocLabel(applicationId, context);
    this.state.valueLabel = this.parentTrace && makeTraceValueLabel(this.parentTrace) || '';
    this.state.parentTraceNameLabel = this.parentTrace && makeTraceLabel(this.parentTrace) || '';
    this.state.parentTraceLocLabel = this.parentTrace && makeTraceLocLabel(this.parentTrace);

    // add controllers
    this.controllers.createComponent('GraphNode', {});
    this.controllers.createComponent('PopperController');
    this.controllers.createComponent('Highlighter');

    // register with root
    this.context.graphRoot._contextNodeCreated(this);

    // build sub graph
    this.buildChildNodes();

    this.state.hasChildren = !!this.children.length;
  }

  get firstTrace() {
    const { applicationId, context: { contextId } } = this.state;
    const { dataProvider } = allApplications.getById(applicationId);
    return dataProvider.util.getFirstTraceOfContext(contextId);
  }

  get contextChildrenAmount() {
    const contextChildren = this.children.getComponents('ContextNode');
    let amount = contextChildren.length;
    contextChildren.forEach(childNode => amount += childNode.contextChildrenAmount);
    return amount;
  }

  buildChildNodes() {
    const {
      applicationId,
      context: {
        contextId
      }
    } = this.state;


    // get all child contexts
    const dp = allApplications.getById(applicationId).dataProvider;
    const childContexts = dp.indexes.executionContexts.children.get(contextId) || EmptyArray;
    childContexts.forEach(childContext => {
      // create child context
      return this.children.createComponent('ContextNode', {
        applicationId,
        context: childContext
      });
    });
  }

  async reveal(expandItself = false) {
    await this.controllers.getComponent('GraphNode').reveal(expandItself);
  }

  setSelected(isSelected) {
    const selectedTrace = traceSelection.selected;
    let traceId = null;
    let isSelectedTraceCallRelated = false;
    let contextIdOfSelectedCallTrace = null;
    // if selected trace is call related, returns the contextId of this call
    if (selectedTrace) {
      traceId = selectedTrace.traceId;
      const { applicationId } = this.state;
      const dp = allApplications.getById(applicationId).dataProvider;
      const callId = dp.util.getCalleeTraceOfTrace(traceId)?.traceId;
      const child = dp.indexes.executionContexts.byCalleeTrace.get(callId);
      isSelectedTraceCallRelated = !!callId;
      contextIdOfSelectedCallTrace = child && child[0].contextId;
    }
    this.setState({ isSelected, traceId, isSelectedTraceCallRelated, contextIdOfSelectedCallTrace });
  }

  isHiddenBy() {
    return this.context.runNode.isHiddenBy();
  }

  public = {
    async goToFirstTrace() {
      await this.componentManager.externals.goToTrace(this.firstTrace);
    },
    async goToParentTrace() {
      if (this.parentTrace) {
        await this.componentManager.externals.goToTrace(this.parentTrace);
      }
    },
    selectFirstTrace() {
      traceSelection.selectTrace(this.firstTrace);
    },
    selectParentTrace() {
      if (this.parentTrace) {
        traceSelection.selectTrace(this.parentTrace);
      }
    },
    toggleStaticContextHighlight() {
      const { applicationId, context: { staticContextId } } = this.state;
      const contextNodeManager = this.context.graphRoot.controllers.getComponent('ContextNodeManager');
      contextNodeManager.toggleStaticContextHighlight(applicationId, staticContextId);
    },
    selectPreviousContextByStaticContext() {
      const { applicationId, context } = this.state;
      const dp = allApplications.getById(applicationId).dataProvider;
      const contexts = dp.indexes.executionContexts.byStaticContext.get(context.staticContextId) || EmptyArray;
      const index = binarySearchByKey(contexts, context, (x) => x.contextId);
      if (index !== 0) {
        const { contextId } = contexts[index - 1];
        this.context.graphRoot.focusContext(applicationId, contextId);
      }
      else {
        this.componentManager.externals.alert('This is the first context of staticContext', false);
      }
    },
    selectNextContextByStaticContext() {
      const { applicationId, context } = this.state;
      const dp = allApplications.getById(applicationId).dataProvider;
      const contexts = dp.indexes.executionContexts.byStaticContext.get(context.staticContextId) || EmptyArray;
      const index = binarySearchByKey(contexts, context, (x) => x.contextId);
      if (index !== contexts.length - 1) {
        const { contextId } = contexts[index + 1];
        this.context.graphRoot.focusContext(applicationId, contextId);
      }
      else {
        this.componentManager.externals.alert('This is the last context of staticContext', false);
      }
    }
  }
}

export default ContextNode;