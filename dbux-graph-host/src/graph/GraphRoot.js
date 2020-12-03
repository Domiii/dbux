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

  has(applicationId, runId) {
    return !!this.get(applicationId, runId);
  }

  *getApplicationIds() {
    for (const runNode of this.getAll()) {
      yield runNode.state.applicationId;
    }
  }

  /**
   * @return {RunNode[]}
   */
  getAll() {
    return this._all.values();
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
    this._unsubscribeOnNewData = [];

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

    // register event listeners
    this.addDisposable(
      allApplications.selection.onApplicationsChanged(() => {
        this.refresh();
      })
    );
    this.addDisposable(
      this.context.graphDocument.onAsyncGraphModeChanged(() => {
        this.refresh();
      })
    );

    this.refresh();
  }

  handleRefresh() {
    if (this.context.graphDocument.asyncGraphMode) {
      this.removeAllRunNode();
      this._setApplicationState();
    }
    else {
      // oldApps
      const oldAppIds = new Set(this.runNodesById.getApplicationIds());
      const newAppIds = new Set(allApplications.selection.getAll().map(app => app.applicationId));

      // remove old runNode
      for (const runNode of this.runNodesById.getAll()) {
        const { applicationId, runId } = runNode.state;
        if (!newAppIds.has(applicationId)) {
          this.removeRunNode(applicationId, runId);
        }
      }

      // add new runNode
      for (const appId of newAppIds) {
        if (!oldAppIds.has(appId)) {
          const app = allApplications.getById(appId);
          const allContexts = app.dataProvider.collections.executionContexts.getAll();
          this.addRunNodeByContexts(appId, allContexts);
        }
      }

      // always re-subscribe since applicationSet clears subscribtion everytime it changes
      this._resubscribeOnData();
      this._setApplicationState();
    }
  }

  _resubscribeOnData() {
    // unsubscribe old
    this._unsubscribeOnNewData.forEach(f => f());
    this._unsubscribeOnNewData = [];

    // subscribe new
    for (const app of allApplications.selection.getAll()) {
      const { applicationId, dataProvider } = app;
      const unsubscribe = dataProvider.onData('executionContexts',
        (newContexts) => {
          const newNodes = this.addRunNodeByContexts(applicationId, newContexts);
          this._setApplicationState();
          this._emitter.emit('newNode', newNodes);
        }
      );
      this._unsubscribeOnNewData.push(unsubscribe);
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

  async focusContext(applicationId, contextId) {
    await this.focusController.focus(applicationId, contextId);
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

  removeAllRunNode() {
    for (const { state: { applicationId, runId } } of this.getAllRunNode()) {
      this.removeRunNode(applicationId, runId);
    }
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