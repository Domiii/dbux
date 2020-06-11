import NanoEvents from 'nanoevents';
import allApplications from 'dbux-data/src/applications/allApplications';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import GraphNodeMode from 'dbux-graph-common/src/shared/GraphNodeMode';
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

  /**
   * @return {RunNode}
   */
  get(applicationId, runId) {
    return this._all.get(this.makeKey(applicationId, runId));
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
    this._emitter = new NanoEvents();

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

    // gives initial state
    this.state.applications = allApplications.selection.getAll().map(app => ({
      applicationId: app.applicationId,
      entryPointPath: app.entryPointPath,
      name: app.getPreferredName()
    }));
  }

  refresh = () => {
    this.clear();

    for (const app of allApplications.selection.getAll()) {
      const { applicationId, dataProvider } = app;

      // add existing children contexts
      const contexts = dataProvider.collections.executionContexts.getAll();
      this.addRunNodeByContexts(applicationId, contexts);

      // subscribe to contexts update
      allApplications.selection.subscribe(
        dataProvider.onData('executionContexts',
          (newContexts) => {
            const newNodes = this.addRunNodeByContexts(applicationId, newContexts);
            this._updateClient();
            this._emitter.emit('newNode', newNodes);
          }
        )
      );
    }

    this._updateClient();
    this._emitter.emit('refresh');
  }

  _updateClient() {
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

  clear() {
    // dispose RunNodes
    const allRunNodes = this.getAllRunNode();
    for (let i = 0; i < allRunNodes.length; i++) {
      allRunNodes[i].dispose();
    }
    
    this.runNodesById = new RunNodeMap();
    this.contextNodesByContext = new Map();
    
    // notify cleared
    this._emitter.emit('clear');
  }

  addRunNodeByContexts(applicationId, contexts) {
    const runIds = new Set(contexts.map(context => context?.runId || 0));
    const newNodes = [];

    runIds.forEach(runId => {
      if (runId) {
        const newNode = this.buildRunNode(applicationId, runId);
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

  buildRunNode(applicationId, runId) {
    const newNode = this.children.createComponent(RunNode, { applicationId, runId });
    this.runNodesById.set(applicationId, runId, newNode);
    return newNode;
  }

  /**
   * @return {RunNode[]}
   */
  getAllRunNode() {
    return this.children.getComponents('RunNode') || EmptyArray;
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