import { newLogger } from 'dbux-common/src/log/logger';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';

import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import applicationCollection from 'dbux-data/src/applicationCollection';
import Application from 'dbux-data/src/Application';
import EventHandlerList from 'dbux-common/src/util/EventHandlerList';
import ContextNode from './ContextNode';

const { log, debug, warn, error: logError } = newLogger('TreeData');

export class TreeNodeProvider {
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
    this.appEventHandlers = new EventHandlerList();

    applicationCollection.selection.onSelectionChanged((selectedApps) => {
      this.appEventHandlers.unsubscribe();
      this.clear();
      for (const app of selectedApps) {
        const executionContexts = app.dataProvider.collections.executionContexts.getAll();
        this.update(app, executionContexts);
        this.appEventHandlers.subscribe(
          app.dataProvider.onData('executionContexts', this.update.bind(this, app))
        );
      }
    });
  }

  contextToNode = (applicationId: number, context: ExecutionContext) => {
    if (!context) return null;

    const { dataProvider } = applicationCollection.getApplication(applicationId);
    const { contextType, stackDepth, contextId, staticContextId, parentContextId } = context;

    const staticContext = dataProvider.collections.staticContexts.getById(staticContextId);
    const { programId, displayName, loc } = staticContext;

    const programContext = dataProvider.collections.staticProgramContexts.getById(programId);
    const { filePath, fileName } = programContext;

    const parentNode = (parentContextId) ? this.contextNodesByApp[applicationId][parentContextId] : null;
    const typeName = ExecutionContextType.nameFrom(contextType);

    let newNode = new ContextNode(
      displayName,
      typeName,
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