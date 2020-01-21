import { newLogger } from 'dbux-common/src/log/logger';
import { getCodePositionFromLoc } from '../util/codeUtil';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';
import path from 'path';
import { 
    TreeItem,
    EventEmitter,
    TreeItemCollapsibleState as CollapsibleState 
} from 'vscode';

const { log, debug, warn, error: logError } = newLogger('TreeData');

export class EventNodeProvider {

    constructor(dataProvider) {
        this.dataProvider = dataProvider;
        this.nodesByContext = [];
        this.rootNodes = [];
        this._onDidChangeTreeData = new EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    contextToNode = (context: ExecutionContext) => {
        if (!context) return null;

        debug('Converting context', context)
        const { contextType, stackDepth, contextId, staticContextId, parentContextId } = context;
        
        const staticContext = this.dataProvider.collections.staticContexts.getById(staticContextId);
        debug('staticContext =', staticContext)
        const { programId, name, displayName, loc } = staticContext
        
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
            parentNode
        );

        return newNode;

    }
    refresh = () => {
        this._onDidChangeTreeData.fire();
        log(this.nodesByContext)
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
        return node.parentNode
    }
}

export class ContextNode extends TreeItem {

	constructor(
        displayName,
        typeName,
        fileName,
        filePath,
        location,
        depth,
        contextId,
        parentContextId = null,
        parentNode = null
    ) {
        // set label
        super(`${displayName} [${typeName}]`);

        // node data
        this.displayName = displayName;
        this.typeName = typeName;
        this.fileName = fileName;
        this.filePath = filePath;
        this.location = location;
        this.depth = depth;
        this.contextId = contextId;
        this.parentContextId = parentContextId;
        this.parentNode = parentNode;

        // treeItem data
        this.children = [];
        this.description = `@${fileName}:${location.start.line}:${location.start.column}`;
        this.collapsibleState = CollapsibleState.None;
        this.command = 'dbuxExtension.showMsg';
        this.contextValue = 'event';
		this.iconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
	}

    pushChild(child){
        this.children.push(child);
        this.collapsibleState = CollapsibleState.Collapsed;
    }

    get(){
        return {
            label: this.label,
            position: this.position,
            collapsibleState: this.collapsibleState,
            command: this.command, 
            parent: this.parent.label,
            children: this.children.map(e => e.label),
            contextValue: this.contextValue
        }
    }

	get tooltip() {
		return `at ${this.fileName}(tooltip)`;
	}

}
