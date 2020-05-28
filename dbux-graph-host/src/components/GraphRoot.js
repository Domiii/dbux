import NanoEvents from 'nanoevents';
import allApplications from 'dbux-data/src/applications/allApplications';
import GraphNodeMode from 'dbux-graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import RunNode from './RunNode';
import ContextNode from './ContextNode';

export class AllRunNodes {
  constructor(buildNode) {
    this._all = new Map();
    this.buildNode = buildNode;
  }

  get(applicationId, runId) {
    return this._all.get(this.makeKey(applicationId, runId));
  }

  /**
   * @return {RunNode[]}
   */
  getAll() {
    return Array.from(this._all.values());
  }

  add(applicationId, runId) {
    if (this.get(applicationId, runId)) {
      // skip if exist
    }
    else {
      const runNode = this.buildNode({ applicationId, runId });
      this._all.set(this.makeKey(applicationId, runId), runNode);
    }
  }

  remove(applicationId, runId) {
    const node = this.get(applicationId, runId);
    if (node) {
      node.dispose();
      this._all.delete(this.makeKey(applicationId, runId));
    }
    else {
      // skip if not exist
    }
  }

  clear() {
    this.getAll().forEach(node => node.dispose());
    this._all = new Map();
  }

  makeKey(appId, runId) {
    return `${appId}_${runId}`;
  }
}

class GraphRoot extends HostComponentEndpoint {
  contextNodesByContext;
  allRunNodes: AllRunNodes;

  init() {
    this.allRunNodes = new AllRunNodes((state) => this.children.createComponent(RunNode, state));
    this.contextNodesByContext = new Map();
    this._emitter = new NanoEvents();

    this.controllers.createComponent('GraphNode', {
      mode: GraphNodeMode.ExpandChildren
    });
    this.controllers.createComponent('FocusController');
    this.controllers.createComponent('PopperManager');
    this.controllers.createComponent('ContextNodeManager');
    this.controllers.createComponent('ZoomBar');
    this.controllers.createComponent('HiddenNodeManager');

    // gives initial state
    this.state.applications = allApplications.selection.getAll().map(app => ({
      applicationId: app.applicationId,
      entryPointPath: app.entryPointPath,
      name: app.getFileName()
    }));
  }

  update() {
    const { applications } = this.state;
    this.updateAllRunNodes(applications);
    this.subscribeContextChange(applications);
  }

  updateAllRunNodes(applications) {
    this.clear();

    // build run nodes
    for (const { applicationId } of applications) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const contexts = dp.collections.executionContexts.getAll();
      this.addRunNodeByContexts(applicationId, contexts);
    }

    this._emitter.emit('refresh');
  }

  clear() {
    this.allRunNodes.clear();
    this.contextNodesByContext = new Map();
  }

  subscribeContextChange(applications) {
    for (const { applicationId } of applications) {
      const app = allApplications.getById(applicationId);
      allApplications.selection.subscribe(
        app.dataProvider.onData('executionContexts', (contexts) => {
          this.addRunNodeByContexts(applicationId, contexts);
          this._emitter.emit('newNode');
        })
      );
    }
  }

  addRunNodeByContexts(applicationId, contexts) {
    const runIds = new Set(contexts.map(context => context?.runId || 0));

    runIds.forEach(runId => {
      if (runId) {
        this.allRunNodes.add(applicationId, runId);
      }
    });
  }

  focusContext(applicationId, contextId) {
    this.focusController.focus(applicationId, contextId);
  }

  // ###########################################################################
  // own event listener
  // ###########################################################################

  on(eventName, cb) {
    this._emitter.on(eventName, cb);
  }

  // ###########################################################################
  // getters
  // ###########################################################################

  get focusController() {
    return this.controllers.getComponent('FocusController');
  }

  // ###########################################################################
  // run node management
  // ###########################################################################

  getRunNodeById(applicationId, runId) {
    return this.allRunNodes.get(applicationId, runId);
  }

  getAllRunNode() {
    return this.allRunNodes.getAll();
  }

  // ###########################################################################
  // context node management
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