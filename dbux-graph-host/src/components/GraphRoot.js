import NanoEvents from 'nanoevents';
import allApplications from '@dbux/data/src/applications/allApplications';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';
import RunNode from './RunNode';
import ContextNode from './ContextNode';

export class RunNodeMap {
  constructor() {
    this._all = new Map();
  }

  set(applicationId, runId, node) {
    this._all.set(this.makeKey(applicationId, runId), node);
  }

  delete(applicationId, runId) {
    this._all.delete(this.makeKey(applicationId, runId));
  }

  /**
   * @return {RunNode}
   */
  get(applicationId, runId) {
    return this._all.get(this.makeKey(applicationId, runId));
  }

  getAll() {
    return [...this._all.values()];
  }

  makeKey(appId, runId) {
    return `${appId}_${runId}`;
  }
}

class GraphRoot extends HostComponentEndpoint {
  contextNodesByContext;

  init() {
    this.runNodesById = new RunNodeMap();
    this.contextNodesByContext = new Map();
    this.state.applications = [];
    this._emitter = new NanoEvents();
    this._refreshPromise = null;
    this._refreshRequests = 0;

    this.controllers.createComponent('GraphNode', {
      mode: GraphNodeMode.ExpandChildren
    });
    this.controllers.createComponent('PopperManager');
    this.controllers.createComponent('ContextNodeManager');
    this.controllers.createComponent('ZoomBar');
    this.controllers.createComponent('HiddenNodeManager');
    this.controllers.createComponent('PopperController');
    this.controllers.createComponent('FocusController');

    this.children.createComponent('HiddenBeforeNode');
    this.children.createComponent('HiddenAfterNode');

    this.refresh();
  }

  refresh = () => {
    ++this._refreshRequests;
    if (this._refreshPromise) {
      return;
    }
    this._refreshPromise = this.doRefresh();
  }

  async doRefresh() {
    while (this._refreshRequests) {
      this._refreshRequests = 0;

      // oldApps
      const oldAppIds = new Set(this.state.applications.map(app => app.applicationId));

      // wait for init before dispose something
      await this.componentManager.waitForBusyInit();

      // remove old runNode
      for (const runNode of this.runNodesById.getAll()) {
        const { applicationId, runId } = runNode.state;
        if (!allApplications.selection.containsApplication(applicationId)) {
          this.removeRunNode(applicationId, runId);
        }
      }

      // add new runNode
      for (const app of allApplications.selection.getAll()) {
        if (!oldAppIds.has(app.applicationId)) {
          const allContexts = app.dataProvider.collections.executionContexts.getAll();
          this.addRunNodeByContexts(app.applicationId, allContexts);
        }
      }

      // always re-subscribe since applicationSet clears subscribtion everytime it changes
      this._subscribeOnData();
      this._setApplicationState();

      // wait for init to ensure client side finished
      await this.componentManager.waitForBusyInit();
    }
    this._refreshPromise = null;
    this._emitter.emit('refresh');
  }

  _subscribeOnData() {
    for (const app of allApplications.selection.getAll()) {
      const { applicationId, dataProvider } = app;
      const unsubscribe = dataProvider.onData('executionContexts',
        (newContexts) => {
          const newNodes = this.addRunNodeByContexts(applicationId, newContexts);
          this._setApplicationState();
          this._emitter.emit('newNode', newNodes);
        }
      );
      allApplications.selection.subscribe(unsubscribe);
      this.addDisposable(unsubscribe);
    }
  }

  _setApplicationState() {
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

  addRunNodeByContexts(applicationId, contexts) {
    const runIds = new Set(contexts.map(context => context?.runId || 0));
    const newNodes = [];

    runIds.forEach(runId => {
      if (runId) {
        const newNode = this.addRunNode(applicationId, runId);
        newNodes.push(newNode);
      }
    });

    return newNodes;
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

  addRunNode(applicationId, runId) {
    const newNode = this.children.createComponent(RunNode, { applicationId, runId });
    this.runNodesById.set(applicationId, runId, newNode);
    return newNode;
  }

  removeRunNode(applicationId, runId) {
    const runNode = this.runNodesById.get(applicationId, runId);
    runNode.dispose();
    this.runNodesById.delete(applicationId, runId);
  }

  /**
   * @return {RunNode[]}
   */
  getAllRunNode() {
    return this.runNodesById.getAll();
  }

  getRunNodeById(applicationId, runId) {
    return this.runNodesById.get(applicationId, runId);
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

  }
}

export default GraphRoot;