import allApplications from 'dbux-data/src/applications/allApplications';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import traceSelection from 'dbux-data/src/traceSelection';
import RunNode from './RunNode';

class GraphRoot extends HostComponentEndpoint {
  contextNodesByContext = [];

  init() {
    // add GraphNode controller
    this.controllers.createComponent('FocusController');
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
        name: app.getFileName()
      }))
    };
    this.setState(update);
  }

  addContexts(applicationId, contexts) {
    // get unique set of runIds
    let runIds = new Set(contexts.map(context => context?.runId || 0));
    runIds.delete(0);
    runIds = Array.from(runIds);
    runIds.sort((a, b) => a - b);     // sort runIds in ascending order (because set is unordered)

    // create Run nodes
    runIds.forEach(runId =>
      this.children.createComponent(RunNode, { applicationId, runId })
    );
  }

  // ###########################################################################
  // context management
  // ###########################################################################

  getContextNodeByContext(context) {
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
    requestFocus: (applicationId, contextId) => {
      this.controllers.getComponent('FocusController').focus(applicationId, contextId);
    }
  }
}

export default GraphRoot;