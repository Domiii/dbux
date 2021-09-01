import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import SyncGraphBase from '../SyncGraphBase';
import RunNode from './RunNode';
import ContextNode from './ContextNode';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('GraphRoot');

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

class SyncGraph extends SyncGraphBase {
  /**
   * @type {Map<ExecutionContext, ContextNode>}
   */
  contextNodesByContext;

  init() {
    super.init();
    this.runNodesById = new RunNodeMap();
    if (!('preferAsyncMode' in this.state)) {
      this.state.preferAsyncMode = false;
    }
    
    this.controllers.createComponent('HiddenNodeManager');
    this.children.createComponent('HiddenBeforeNode');
    this.children.createComponent('HiddenAfterNode');

    // TODO-M: change to refresh
    this.updateRunNodes();
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
    // log(`Added RunNode of applicationId ${applicationId}, runId ${runId}`);
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

  _buildContextNode(parentNode, applicationId, context, isRoot = false) {
    if (this.contextNodesByContext.get(context)) {
      this.logger.warn(`ContextNode with id=${context.contextId} already exist`);
      return null;
    }

    const nodeClass = isRoot ? 'RootContextNode' : 'ContextNode';

    const contextNode = parentNode.children.createComponent(nodeClass, {
      applicationId,
      context
    });

    this.contextNodesByContext.set(context, contextNode);
    contextNode.addDisposable(() => {
      this.contextNodesByContext.delete(context);
    });

    // this.logger.log(`ContextNode created id=${context.contextId}`);
    return contextNode;
  }

  buildContextNodeChildren(contextNode) {
    if (contextNode.childrenBuilt) {
      return contextNode.children.getComponents('ContextNode');
    }

    contextNode.childrenBuilt = true;
    const { applicationId } = contextNode.state;
    return contextNode.getValidChildContexts().map(context => {
      return this._buildContextNode(contextNode, applicationId, context);
    });
  }

  buildContextNode(context) {
    const { applicationId } = context;
    const dp = allApplications.getById(applicationId).dataProvider;
    let currentContext = context;
    let currentNode;
    const contextQueue = [];

    while (!(currentNode = this.contextNodesByContext.get(currentContext))) {
      if (!currentContext) {
        this.logger.error(`Cannot build context node: RootContextNode does not exist. contextQueue=[${contextQueue.map(x => x?.contextId)}]`);
        return null;
      }
      contextQueue.push(currentContext);
      currentContext = dp.collections.executionContexts.getById(currentContext.parentContextId);
    }

    for (const childContext of contextQueue.reverse()) {
      this.buildContextNodeChildren(currentNode);
      currentNode = this.contextNodesByContext.get(childContext);
    }

    return currentNode;
  }

  async getContextNodeById(applicationId, contextId) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(contextId);
    return await this.getContextNodeByContext(context);
  }

  /**
   *  @return {Promise<ContextNode>}
   */
  getContextNodeByContext = async (context) => {
    let node = this.contextNodesByContext.get(context);
    if (!context) {
      logError(`Cannot find ContextNode of context ${context}`);
      return null;
    }
    else if (!node) {
      // node not created
      node = this.buildContextNode(context);
    }

    await node?.waitForInit();

    return node;
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

export default SyncGraph;