/* eslint-disable class-methods-use-this */
'use strict'

import vscode, { CommentThreadCollapsibleState } from 'vscode';
import path from 'path';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';

const log = (...args) => console.log('[dbux-code][treeData]', ...args)

export class EventNodeProvider {

    constructor(contextData, dataProvider) {
        this.contextData = contextData;
        this.dataProvider = dataProvider;
        this.treeData = this.parseData(this.contextData)
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    parseData = (contextData) => {

        log('try parsing contextData', contextData)
        log('executionContext =', this.dataProvider.collections.executionContexts.getAll())
        
        let newRootEvent = new Event('root', new NodePosition(), '', -1);
        let lastNode = newRootEvent;

        for (let index = 1; index < contextData.length; index++){
            
            let element = contextData[index]
            log('element =', element)
            let { contextType, stackDepth, contextId, staticContextId } = element;
            
            let staticContext = this.dataProvider.collections.staticContexts.getById(staticContextId);
            log('staticContext =', staticContext)
            let { programId, name, displayName, loc } = staticContext
            
            let programContext = this.dataProvider.collections.staticProgramContexts.getById(programId);
            log('programContext =', programContext)
            let { filePath, fileName } = programContext

            let typeName = ExecutionContextType.nameFrom(contextType);

            let newNode = new Event(
                `${displayName} [${typeName}]`,
                new NodePosition(filePath, loc.start.line, loc.start.column),
                fileName,
                stackDepth
            );

            if (stackDepth > lastNode.depth){
                newNode.parent = lastNode;
            }
            else if (stackDepth === lastNode.depth){
                newNode.parent = lastNode.parent;
            }
            else if (stackDepth < lastNode.depth){
                newNode.parent = lastNode.parent.parent;
            }

            newNode.parent.pushChild(newNode);
            lastNode = newNode;
        }

        log('New parse result', newRootEvent.children)
        return newRootEvent.children

    }
    refresh = () => {
        this.treeData = this.parseData(this.contextData);
        this._onDidChangeTreeData.fire();
    }
    update = (data) => {
        log('Called update function.')
        this.contextData = this.dataProvider.collections.executionContexts.getAll();
        this.refresh();
    }
    getTreeItem = (element) => {
        return element;
    }
    getChildren = (element) => {
        if (element){
            log('called function getChildren with element, returning', element.children)
            return element.children
        }
        else {
            log('called function getChildren without passing parameter, returning', this.treeData)
            return this.treeData
        }
        // if (!this.workspaceRoot) {
        //     vscode.window.showInformationMessage('No event logged.');
        //     return Promise.resolve([]);
        // }
        // if (element) {
        //     return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
        // }
        // else {
        //     const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        //     if (this.pathExists(packageJsonPath)) {
        //         return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
        //     }
        //     else {
        //         vscode.window.showInformationMessage('Workspace has no package.json');
        //         return Promise.resolve([]);
        //     }
        // }
    }
}

class NodePosition {
    constructor(filePath = '', line = 0, character = 0){
        this.filePath = filePath;
        this.line = line;
        this.character = character;
    }
}

export class Event extends vscode.TreeItem {

	constructor(
        label,
        position,
        fileName,
        depth = 0,
        parent = null
    ) {
        super(label);

        // parameter value
        this.lable = label;
        this.position = position;
        this.description = `@${fileName}:${position.line}:${position.column}`;
        this.depth = depth;
        this.parent = parent;

        // default value
        this.children = [];
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        this.command = 'dbuxExtension.showMsg';
        this.contextValue = 'event';
		this.iconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
	}

    pushChild(child){
        this.children.push(child);
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
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
		return `at ${this.position}(tooltip)`;
	}

}
