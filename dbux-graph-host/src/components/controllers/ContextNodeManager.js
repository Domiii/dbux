import isEqual from 'lodash/isEqual';
import Enum from 'dbux-common/src/util/Enum';
import allApplications from 'dbux-data/src/applications/allApplications';
import objectTracker from 'dbux-data/src/objectTracker';
import GraphNodeMode from 'dbux-graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

let SelectorType = {
  ObjectTrace: 1,
  StaticContext: 2,
  Search: 3
};

SelectorType = new Enum(SelectorType);

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
    if (this.selector && !allApplications.selection.containsApplication(this.selector.applicationId)) {
      // block highlighting on non-active apps
      this.clear();
    }
    else {
      switch (this.selectorType) {
        case SelectorType.ObjectTrace: {
          this.highlightByObject(this.selector);
          break;
        }
        case SelectorType.StaticContext: {
          const { applicationId, staticContextId } = this.selector;
          this.highlightByStaticContext(applicationId, staticContextId);
          break;
        }
        case SelectorType.Search: {
          const { searchTerm } = this.selector;
          this.highlightBySearchTerm(searchTerm);
          break;
        }
      }
    }
  }

  highlightContexts(contexts) {
    this.contextNodes = contexts.map(this.owner.getContextNodeByContext);
    this.contextNodes.forEach((contextNode) => contextNode?.controllers.getComponent('Highlighter').inc());
    this.contextNodes.forEach((contextNode) => contextNode?.reveal());
  }

  clear() {
    this.contextNodes?.forEach((contextNode) => {
      if (!contextNode.isDisposed) {
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

    this.context.graphRoot.controllers.getComponent('FocusController').setSyncMode(false);

    const dp = allApplications.getById(applicationId).dataProvider;
    const contexts = dp.indexes.executionContexts.byStaticContext.get(staticContextId);

    this.selector = { applicationId, staticContextId };
    this.selectorType = SelectorType.StaticContext;
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
    this.selectorType = SelectorType.ObjectTrace;
    this.highlightContexts(contexts);
  }

  toggleObjectHighlight = (trace) => {
    if (trace === this.selector) {
      this.clear();
    }
    else {
      this.highlightByObject(trace);
    }
  }

  // ###########################################################################
  // search
  // ###########################################################################


  highlightBySearchTerm(searchTerm) {
    if (this.selector) this.clear();
    if (!searchTerm) {
      return;
    }

    this.context.graphRoot.controllers.getComponent('GraphNode').setMode(GraphNodeMode.Collapsed);
    this.context.graphRoot.controllers.getComponent('FocusController').setSyncMode(false);

    const contexts = allApplications.selection.getAll().
      map(({ dataProvider: dp }) => dp.util.searchContexts(searchTerm)).
      flat();

    this.selector = { searchTerm };
    this.selectorType = SelectorType.Search;
    this.highlightContexts(contexts);
  }
}