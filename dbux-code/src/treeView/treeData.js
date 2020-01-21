import { newLogger } from 'dbux-common/src/log/logger';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';
import ContextNode from './ContextNode';

const { log, debug, warn, error: logError } = newLogger('TreeData');

export class ContextNodeProvider {

    constructor(dataProvider, onChangeEventEmitter) {
        this.dataProvider = dataProvider;
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

        const parentNode = (parentContextId)? this.nodesByContext[parentContextId] : null;
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
    refresh = () => {
        this.onChangeEventEmitter.fire();
    }
    update = (newContextData) => {
        debug('Called update function.');

        for (let i = 0; i < newContextData.length; i++){
            const context = newContextData[i];
            const newNode = this.contextToNode(context);

            while (this.nodesByContext.length <= newNode.contextId){
                this.nodesByContext.push(null);
            }
            this.nodesByContext[newNode.contextId] = newNode;
    
            if (newNode.parentNode) newNode.parentNode.pushChild(newNode);
            else this.rootNodes.push(newNode);

        }

        this.refresh();
    }
    getTreeItem = (node) => {
        return node;
    }
    getChildren = (node) => {
        if (node){
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