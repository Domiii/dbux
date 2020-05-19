import allApplications from 'dbux-data/src/applications/allApplications';
import objectTracker from 'dbux-data/src/objectTracker';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class ContextNodeManager extends HostComponentEndpoint {
  init() {
    this.selector = null;
    this.contextNodes = null;

    const highlightManager = this.context.graphDocument.controllers.getComponent('HighlightManager');
    highlightManager.on('clear', () => {
      this.selector = null;
      this.contextNodes = null;
    });

    objectTracker.onObjectSelectionChanged(this.highlightByObject);
  }

  highlightContexts(contexts) {
    this.contextNodes = contexts.map(this.owner.getContextNodeByContext);
    this.contextNodes.forEach((contextNode) => contextNode.controllers.getComponent('Highlighter').inc());
    this.contextNodes.forEach((contextNode) => contextNode.reveal());
  }

  clear() {
    this.contextNodes?.forEach((contextNode) => contextNode.controllers.getComponent('Highlighter').dec());
    this.selector = null;
    this.contextNodes = null;
  }

  // ###########################################################################
  //  byStaticContext
  // ###########################################################################

  highlightByStaticContext = (applicationId, staticContextId) => {
    if (this.selector) this.clear();
    const dp = allApplications.getById(applicationId).dataProvider;
    this.selector = dp.collections.staticContexts.getById(staticContextId);
    const contexts = dp.indexes.executionContexts.byStaticContext.get(staticContextId);
    this.highlightContexts(contexts);
  }

  toggleStaticContextHighlight = (applicationId, staticContextId) => {
    const dp = allApplications.getById(applicationId).dataProvider;
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    if (staticContext === this.selector) {
      this.clear();
    }
    else {
      this.highlightByStaticContext(applicationId, staticContextId);
    }
  }

  // ###########################################################################
  //  byObject
  // ###########################################################################

  highlightByObject = (trace) => {
    if (this.selector) this.clear();

    const { applicationId, traceId } = trace;
    const dp = allApplications.getById(applicationId).dataProvider;

    trace = dp.util.getValueTrace(traceId);
    const trackId = dp.util.getTraceTrackId(traceId);
    const contexts = dp.util.getContextsByTrackId(trackId);

    this.selector = trace;
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