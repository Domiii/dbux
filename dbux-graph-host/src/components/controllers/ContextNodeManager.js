import allApplications from 'dbux-data/src/applications/allApplications';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class ContextNodeManager extends HostComponentEndpoint {
  init() {
    this.staticContext = null;
    this.contextNodes = null;

    const highlightManager = this.context.graphDocument.controllers.getComponent('HighlightManager');
    highlightManager.on('clear', () => {
      this.staticContext = null;
      this.contextNodes = null;
    });
  }

  highlightByStaticContext = (applicationId, staticContextId) => {
    if (this.staticContext) this.clear();
    const dp = allApplications.getById(applicationId).dataProvider;
    this.staticContext = dp.collections.staticContexts.getById(staticContextId);
    const contexts = dp.indexes.executionContexts.byStaticContext.get(staticContextId);
    this.contextNodes = contexts.map(this.owner.getContextNodeByContext);
    this.contextNodes.forEach((contextNode) => contextNode.highlighter.inc());
  }

  toggleStaticContextHighlight = (applicationId, staticContextId) => {
    const dp = allApplications.getById(applicationId).dataProvider;
    const staticContext = dp.collections.staticContexts.getById(staticContextId);
    if (staticContext === this.staticContext) {
      this.clear();
    }
    else {
      this.highlightByStaticContext(applicationId, staticContextId);
    }
  }

  clear() {
    this.contextNodes?.forEach((contextNode) => contextNode.highlighter.dec());
    this.staticContext = null;
    this.contextNodes = null;
  }

  public = {

  }
}