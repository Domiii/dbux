import isEqual from 'lodash/isEqual';
import { newLogger } from '@dbux/common/src/log/logger';
import Enum from '@dbux/common/src/util/Enum';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { throttle } from '@dbux/common/src/util/scheduling';
import allApplications from '@dbux/data/src/applications/allApplications';
import objectTracker from '@dbux/data/src/objectTracker';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ContextNodeManager');

const SelectorTypeConfig = {
  ObjectTrace: 1,
  StaticContext: 2,
  Search: 3,
};

/**
 * @type {(Enum|typeof SelectorTypeConfig)}
 */
const SelectorType = new Enum(SelectorTypeConfig);

export { SelectorType };

const FindContextsByMode = {
  [SelectorType.ObjectTrace]: (selector) => {
    const { applicationId, traceId: originTraceId } = selector;
    const dp = allApplications.getById(applicationId).dataProvider;

    const { traceId } = dp.util.getValueTrace(originTraceId);
    const refId = dp.util.getTraceRefId(traceId);
    const contexts = dp.util.getContextsByRefId(refId);
    return contexts;
  },
  [SelectorType.StaticContext]: (selector) => {
    const { applicationId, staticContextId } = selector;
    const dp = allApplications.getById(applicationId).dataProvider;
    const contexts = dp.indexes.executionContexts.byStaticContext.get(staticContextId);
    return contexts;
  },
  [SelectorType.Search]: (selector) => {
    const { searchController } = selector;
    return searchController.contexts;
  }
};


export default class ContextNodeManager extends HostComponentEndpoint {
  init() {
    this.selector = null;
    this.selectorType = null;
    this.contextNodes = null;

    const highlightManager = this.context.graphContainer.controllers.getComponent('HighlightManager');
    this.addDisposable(highlightManager.on('clear', () => {
      this.selector = null;
      this.selectorType = null;
      this.contextNodes = null;
    }));

    this.owner.on('newNode', this.refreshOnData);
    this.owner.on('refresh', this.refreshOnData);

    this.addDisposable(objectTracker.onObjectSelectionChanged(this.highlightByObject));
  }

  refreshOnData = throttle(async () => {
    if (this.selector?.applicationId && !allApplications.selection.containsApplication(this.selector.applicationId)) {
      // block highlighting on non-active apps
      this.clear();
    }
    else if (this.selectorType) {
      await this.highlight(this.selectorType, this.selector);
    }
  }, 100);

  async highlightContexts(contexts) {
    this.contextNodes = contexts.map(this.owner.getOrCreateContextNodeByContext);
    return await Promise.all(this.contextNodes.map(async (contextNode) => {
      await contextNode.waitForInit();
      contextNode.controllers.getComponent('Highlighter').inc();
      await contextNode.reveal();
    }));
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

  /** ###########################################################################
   *   highlight
   *  #########################################################################*/

  async highlight(mode, selector, disableFollowMode = true) {
    if (this.selector) {
      this.clear();
    }

    if (!mode || !selector) {
      return EmptyArray;
    }

    this.context.graphRoot.controllers.getComponent('GraphNode').setMode(GraphNodeMode.ExpandChildren);
    // if (disableFollowMode) {
    //   this.context.graphDocument.setFollowMode(false);
    // }

    const contexts = FindContextsByMode[mode](selector, this);

    this.selector = selector;
    this.selectorType = mode;
    await this.highlightContexts(contexts);

    return contexts;
  }

  /** ###########################################################################
   *   public
   *  #########################################################################*/

  toggleStaticContextHighlight = async (selector) => {
    if (isEqual(this.selector, selector)) {
      this.clear();
    }
    else {
      await this.highlight(SelectorType.StaticContext, selector);
    }
  }

  highlightByObject = async (trace) => {
    return await this.highlight(SelectorType.ObjectTrace, trace);
  }
}