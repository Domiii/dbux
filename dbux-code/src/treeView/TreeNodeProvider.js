import { newLogger } from 'dbux-common/src/log/logger';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';
import ContextNode from './ContextNode';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';

const { log, debug, warn, error: logError } = newLogger('TreeData');

export class TreeNodeProvider {
    
    contexts: ExecutionContext[];
    nodesByContext: ContextNode[];
    rootNodes: ContextNode[];
    lastNode: ContextNode;

    constructor(dataProvider, onChangeEventEmitter) {
        this.dataProvider = dataProvider;
        this.contexts = []
        this.nodesByContext = [];
        this.rootNodes = [];
        this.onChangeEventEmitter = onChangeEventEmitter;
        this.onDidChangeTreeData = onChangeEventEmitter.event;

        this.dataProvider.__old_onData('executionContexts', this.update);
    }

    contextToNode = (context: ExecutionContext) => {
        if (!context) return null;

        const { contextType, stackDepth, contextId, staticContextId, parentContextId } = context;

        const staticContext = this.dataProvider.collections.staticContexts.getById(staticContextId);
        const { programId, displayName, loc } = staticContext;

        const programContext = this.dataProvider.collections.staticProgramContexts.getById(programId);
        const { filePath, fileName } = programContext;

        const parentNode = (parentContextId) ? this.nodesByContext[parentContextId] : null;
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
        // this.contexts = [];
        // this.nodesByContext = [];
        this.rootNodes = [];
        // this.lastNode = null;
        this.refresh();
    }
    refresh = () => {
        this.onChangeEventEmitter.fire();
    }
    update = (newContextData: Array<ExecutionContext>) => {
        for (let i = 0; i < newContextData.length; i++) {

            const context = newContextData[i];
            this.contexts[context.contextId] = context;
            
            const newNode = this.contextToNode(context);

            this.nodesByContext[newNode.contextId] = newNode;

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