import allApplications from 'dbux-data/src/applications/allApplications';
import GraphNodeMode from 'dbux-graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import RunNode from './RunNode';
import ContextNode from './ContextNode';

class GraphRoot extends HostComponentEndpoint {
  contextNodesByContext = [];
  runNodesById = [];

  init() {
    this.controllers.createComponent('GraphNode', {
      mode: GraphNodeMode.ExpandChildren
    });
    this.controllers.createComponent('FocusController');
    this.controllers.createComponent('PopperManager');
    this.controllers.createComponent('ContextNodeManager');
    this.controllers.createComponent('ZoomBar');
  }

  clear() {
    // clear
    this.children.clear();
    this.contextNodesByContext = new Map();
  }

  refresh() {
    // call setState with refreshed data
    const update = {
      applications: allApplications.selection.getAll().map(app => ({
        applicationId: app.applicationId,
        entryPointPath: app.entryPointPath,
        name: app.getPreferredName()
        // name: app.getRelativeFolder()
      }))
    };
    this.setState(update);
  }

  addContextNodes = (applicationId, contexts) => {
    // get unique set of runIds
    let runIds = new Set(contexts.map(context => context?.runId || 0));
    runIds.delete(0);
    runIds = Array.from(runIds);
    runIds.sort((a, b) => a - b);     // sort runIds in ascending order (because set is unordered)

    // create Run nodes
    runIds.forEach(runId =>
      this.children.createComponent(RunNode, { applicationId, runId })
    );

    // create and/or update Context nodes
    this.controllers.getComponent('ContextNodeManager').refreshOnData();
  }

  focusContext(applicationId, contextId) {
    this.controllers.getComponent('FocusController').focus(applicationId, contextId);
  }

  // ###########################################################################
  // context management
  // ###########################################################################

  getContextNodeById(applicationId, contextId) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(contextId);
    return this.getContextNodeByContext(context);
  }

  /**
   *  @return {ContextNode}
   */
  getContextNodeByContext = (context) => {
    return this.contextNodesByContext.get(context);
  }

  _contextNodeCreated(contextNode) {
    const { state: { context } } = contextNode;
    this.contextNodesByContext.set(context, contextNode);
  }
  
  // ###########################################################################
  // shared
  // ###########################################################################

  shared() {
    return {
      context: {
        graphRoot: this
      }
    };
  }

  // ###########################################################################
  // public
  // ###########################################################################

  public = {
    requestFocus(applicationId, contextId) {
      this.focusContext(applicationId, contextId);
    }
  }
}

export default GraphRoot;