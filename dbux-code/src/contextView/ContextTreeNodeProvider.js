import { newLogger } from 'dbux-common/src/log/logger';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import allApplications from 'dbux-data/src/applications/allApplications';
import ContextNode from './ContextNode';

const { log, debug, warn, error: logError } = newLogger('TreeData');

// deprecated, used to find the complete context tree
export class ContextNodeProvider {
  contextsByApp: Array<Array<ExecutionContext>>;
  contextNodesByApp: Array<Array<ContextNode>>;
  rootNodes: Array<ContextNode>;
  lastNode: ContextNode;

  constructor(onChangeEventEmitter) {
    this.contextsByApp = [];
    this.contextNodesByApp = [];
    this.rootNodes = [];
    this.onChangeEventEmitter = onChangeEventEmitter;
    this.onDidChangeTreeData = onChangeEventEmitter.event;
    this.selectedApps = [];

    allApplications.selection.onApplicationsChanged((selectedApps) => {
      for (const app of selectedApps) {
        const executionContexts = app.dataProvider.collections.executionContexts.getAll();
        allApplications.selection.subscribe(
          app.dataProvider.onData('executionContexts', this.update.bind(this, app))
        );
      }
    });
  }

  contextToNode = (applicationId: number, context: ExecutionContext) => {
    if (!context) return null;

    const { dataProvider } = allApplications.getApplication(applicationId);
    const { stackDepth, contextId, staticContextId, parentContextId } = context;

    const staticContext = dataProvider.collections.staticContexts.getById(staticContextId);
    const { programId, displayName, loc } = staticContext;

    const programContext = dataProvider.collections.staticProgramContexts.getById(programId);
    const { filePath, fileName } = programContext;

    const parentNode = this.contextNodesByApp[applicationId][parentContextId] || null;

    let newNode = new ContextNode(
      displayName,
      fileName,
      filePath,
      loc,
      stackDepth,
      applicationId,
      contextId,
      parentContextId,
      parentNode,
      this
    );

    return newNode;
  }
  clear = () => {
    this.contextsByApp = [];
    this.contextNodesByApp = [];
    this.rootNodes = [];
    this.lastNode = null;
  }
  refresh = () => {
    this.onChangeEventEmitter.fire();
  }
  update = (applicationId: number, newContextData: Array<ExecutionContext>) => {
    if (!this.contextsByApp[applicationId]) this.contextsByApp[applicationId] = [];
    if (!this.contextNodesByApp[applicationId]) this.contextNodesByApp[applicationId] = [];

    for (const context of newContextData) {
      if (!context) continue;
      const newNode = this.contextToNode(applicationId, context);
      this.contextsByApp[applicationId][context.contextId] = context;
      this.contextNodesByApp[context.contextId] = newNode;

      if (newNode.parentNode) newNode.parentNode.pushChild(newNode);
      else this.rootNodes.unshift(newNode);
    }
    this.refresh();
  }
  getTreeItem = (node) => {
    return node;
  }
  getChildren = (node) => {
    if (node) {
      return node.children;
    }
    else {
      return this.rootNodes;
    }
  }
  getParent = (node: ContextNode) => {
    return node.parentNode;
  }
}