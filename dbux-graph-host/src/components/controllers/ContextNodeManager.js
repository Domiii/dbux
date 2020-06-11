import isEqual from 'lodash/isEqual';
import allApplications from 'dbux-data/src/applications/allApplications';
import objectTracker from 'dbux-data/src/objectTracker';
import GraphNodeMode from 'dbux-graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class ContextNodeManager extends HostComponentEndpoint {
  init() {
    this.selector = null;
    this.selectorType = null;
    this.contextNodes = null;

    const highlightManager = this.context.graphDocument.controllers.getComponent('HighlightManager');
    highlightManager.on('clear', () => {
      this.selector = null;
      this.selectorType = null;
      this.contextNodes = null;
    });

    this.owner.on('newNode', this.refreshOnData);
    this.owner.on('refresh', this.refreshOnData);

    objectTracker.onObjectSelectionChanged(this.highlightByObject);
  }

  refreshOnData = () => {
    if (!allApplications.selection.containsApplication(this.selector?.applicationId)) {
      // block highlighting on non-active apps
      this.clear();
    }
    else if (this.selectorType === 'objectTrace') {
      this.highlightByObject(this.selector);
    }
    else if (this.selectorType === 'staticContext') {
      const { applicationId, staticContextId } = this.selector;
      this.highlightByStaticContext(applicationId, staticContextId);
    }
  }

  highlightContexts(contexts) {
    this.contextNodes = contexts.map(this.owner.getContextNodeByContext);
    this.contextNodes.forEach((contextNode) => contextNode?.controllers.getComponent('Highlighter').inc());
    this.contextNodes.forEach((contextNode) => contextNode?.reveal());
  }

  clear() {
    this.contextNodes?.forEach((contextNode) => {
      if (contextNode?.isDisposed) {
        contextNode.controllers.getComponent('Highlighter').dec();
      }
    });
    this.selector = null;
    this.selectorType = null;
    this.contextNodes = null;
  }

  // ###########################################################################
  //  byStaticContext
  // ###########################################################################

  highlightByStaticContext = (applicationId, staticContextId) => {
    if (this.selector) this.clear();
    const dp = allApplications.getById(applicationId).dataProvider;
    const contexts = dp.indexes.executionContexts.byStaticContext.get(staticContextId);

    this.selector = { applicationId, staticContextId };
    this.selectorType = 'staticContext';
    this.highlightContexts(contexts);
  }

  toggleStaticContextHighlight = (applicationId, staticContextId) => {
    if (isEqual(this.selector, { applicationId, staticContextId })) {
      this.clear();
    }
    else {
      this.highlightByStaticContext(applicationId, staticContextId);
    }
  }

  // ###########################################################################
  //  byObject
  // ###########################################################################

  highlightByObject = (traceSelector) => {
    if (this.selector) this.clear();

    this.context.graphRoot.controllers.getComponent('GraphNode').setMode(GraphNodeMode.Collapsed);
    this.context.graphRoot.controllers.getComponent('FocusController').setSyncMode(false);

    const { applicationId, traceId: originTraceId } = traceSelector;
    const dp = allApplications.getById(applicationId).dataProvider;
    
    const { traceId } = dp.util.getValueTrace(originTraceId);
    const trackId = dp.util.getTraceTrackId(traceId);
    const contexts = dp.util.getContextsByTrackId(trackId);

    this.selector = { applicationId, traceId };
    this.selectorType = 'objectTrace';
    this.highlightContexts(contexts);
  }

  toggleObjectHighlight = (trace) => {
    if (trace === this.selector) {
      this.clear();
    }
    else {
      this.highlightByStaticContext(trace);
    }
  }
}