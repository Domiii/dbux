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

    applicationCollection.onSelectionChanged((selectedApps) => {
      this.appEventHandlers.unsubscribe();
      this.clear();
      for (const app of selectedApps) {
        this.update(app, app.dataProvider.collections.executionContexts.getAll());
        this.appEventHandlers.subscribe(
          app.dataProvider.onData('executionContexts', this.update.bind(this, app))
        );
      }
    });

  }

  contextToNode = (app: Application, context: ExecutionContext) => {
    if (!context) return null;

    const { contextType, stackDepth, contextId, staticContextId, parentContextId } = context;

    const staticContext = app.dataProvider.collections.staticContexts.getById(staticContextId);
    const { programId, displayName, loc } = staticContext;

    const programContext = app.dataProvider.collections.staticProgramContexts.getById(programId);
    const { filePath, fileName } = programContext;

    const parentNode = (parentContextId) ? this.contextNodesByApp[app.applicationId][parentContextId] : null;
    const typeName = ExecutionContextType.nameFrom(contextType);

    let newNode = new ContextNode(
      displayName,
      typeName,
      fileName,
      filePath,
      loc,
      stackDepth,
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
  update = (app: Application, newContextData: Array<ExecutionContext>) => {
    if (!this.contextsByApp[app.applicationId]) this.contextsByApp[app.applicationId] = [];
    if (!this.contextNodesByApp[app.applicationId]) this.contextNodesByApp[app.applicationId] = [];

    for (const context of newContextData) {
      const newNode = this.contextToNode(context);
      this.contextsByApp[app.applicationId][context.contextId] = context;
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