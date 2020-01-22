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

        this.dataProvider.onData('executionContexts', this.update);
    }

    contextToNode = (context: ExecutionContext) => {
        if (!context) return null;

        debug('Converting context', context)
        const { contextType, stackDepth, contextId, staticContextId, parentContextId } = context;

        const staticContext = this.dataProvider.collections.staticContexts.getById(staticContextId);
        debug('staticContext =', staticContext)
        const { programId, displayName, loc } = staticContext

        const programContext = this.dataProvider.collections.staticProgramContexts.getById(programId);
        debug('programContext =', programContext)
        const { filePath, fileName } = programContext

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
        debug('Called update function.');
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
            debug('called function getChildren with node, returning', node.children);
            return node.children;
        }
        else {
            debug('called function getChildren without passing parameter, returning', this.rootNodes);
            return this.rootNodes;
        }
    }
    getParent = (node: ContextNode) => {
        return node.parentNode;
    }
}