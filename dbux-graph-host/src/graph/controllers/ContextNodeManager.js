import isEqual from 'lodash/isEqual';
import { newLogger } from '@dbux/common/src/log/logger';
import Enum from '@dbux/common/src/util/Enum';
import allApplications from '@dbux/data/src/applications/allApplications';
import objectTracker from '@dbux/data/src/objectTracker';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ContextNodeManager');

let SelectorType = {
  ObjectTrace: 1,
  StaticContext: 2,
  SearchContext: 3,
  SearchTrace: 4
};

SelectorType = new Enum(SelectorType);

export default class ContextNodeManager extends HostComponentEndpoint {
  init() {
    this.selector = null;
    this.selectorType = null;
    this.contextNodes = null;

    const highlightManager = this.context.graphContainer.controllers.getComponent('HighlightManager');
    highlightManager.on('clear', () => {
      this.selector = null;
      this.selectorType = null;
      this.contextNodes = null;
    });

    this.owner.on('newNode', this.refreshOnData);
    this.owner.on('refresh', this.refreshOnData);

    const unsubscribe = objectTracker.onObjectSelectionChanged(this.highlightByObject);
    this.addDisposable(unsubscribe);
  }

  refreshOnData = () => {
    if (this.selector?.applicationId && !allApplications.selection.containsApplication(this.selector.applicationId)) {
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
        case SelectorType.SearchContext: {
          const { searchTerm } = this.selector;
          this.highlightBySearchTermContexts(searchTerm);
          break;
        }
        case SelectorType.SearchTrace: {
          const { searchTerm } = this.selector;
          this.highlightBySearchTermTraces(searchTerm);
          break;
        }
      }
    }
  }

  async highlightContexts(contexts) {
    try {
      this.contextNodes = await Promise.all(contexts.map(this.owner.getContextNodeByContext));
      this.contextNodes.forEach((contextNode) => {
        contextNode?.controllers.getComponent('Highlighter').inc();
      });
      this.contextNodes.forEach((contextNode) => contextNode?.reveal());
    }
    catch (err) {
      logError(err);
    }
  }

  clear() {
    this.contextNodes?.forEach((contextNode) => {
      if (contextNode && !contextNode.isDisposed) {
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

    this.context.graphRoot.controllers.getComponent('FocusController').setFollowMode(false);

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
    this.context.graphRoot.controllers.getComponent('FocusController').setFollowMode(false);

    const { applicationId, traceId: originTraceId } = traceSelector;
    const dp = allApplications.getById(applicationId).dataProvider;

    const { traceId } = dp.util.getValueTrace(originTraceId);
    const refId = dp.util.getTraceRefId(traceId);
    const contexts = dp.util.getContextsByRefId(refId);

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


  highlightBySearchTermContexts(searchTerm) {
    if (this.selector) this.clear();
    if (!searchTerm) {
      return;
    }

    this.context.graphRoot.controllers.getComponent('GraphNode').setMode(GraphNodeMode.Collapsed);
    this.context.graphRoot.controllers.getComponent('FocusController').setFollowMode(false);

    const contexts = allApplications.selection.getAll().
      map(({ dataProvider: dp }) => dp.util.searchContexts(searchTerm)).
      flat();

    this.selector = { searchTerm };
    this.selectorType = SelectorType.SearchContext;
    this.highlightContexts(contexts);
  }

  highlightBySearchTermTraces(searchTerm) {
    if (this.selector) this.clear();
    if (!searchTerm) {
      return;
    }

    this.context.graphRoot.controllers.getComponent('GraphNode').setMode(GraphNodeMode.Collapsed);
    this.context.graphRoot.controllers.getComponent('FocusController').setFollowMode(false);

    const contexts = allApplications.selection.getAll().
      map(({ dataProvider: dp }) => dp.util.findContextsByTraceSearchTerm(searchTerm)).
      flat();

    this.selector = { searchTerm };
    this.selectorType = SelectorType.SearchTrace;
    this.highlightContexts(contexts);
  }
}