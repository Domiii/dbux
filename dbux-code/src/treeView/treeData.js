/* eslint-disable class-methods-use-this */
'use strict'

import vscode from 'vscode';
import path from 'path';

const log = (...args) => console.log('[dbux-code][treeData]', ...args)

export class EventNodeProvider {

    constructor(contextData, dataProvider) {
        this.contextData = contextData;
        this.dataProvider = dataProvider;
        this.treeData = this.parseData(this.contextData)
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    parseData(contextData){
        log('try parsing contextData', contextData)
        for (element in contextData){
            log(element.get())
        }
        log('Start parsing data')
        const collapsibleState = vscode.TreeItemCollapsibleState
        const rootEvent = new Event("Push index.js", {
            'filePath': 'E:\\works\\dbux\\dbux\\dbux-code\\test\\runTest.js',
            'line': 2,
            'character': 5
        }, collapsibleState.Expanded, 'dbuxExtension.showMsg', null, [])
        const children = [
            new Event('Push meow()', { 'filePath': 'E:\\works\\dbux\\dbux\\dbux-code\\test\\runTest.js', 'line': 10, 'character': 5 }, collapsibleState.None, 'dbuxExtension.showMsg', rootEvent, []),
            new Event('Pop meow()', { 'filePath': 'E:\\works\\dbux\\dbux\\dbux-code\\test\\runTest.js', 'line': 20, 'character': 5 }, collapsibleState.None, 'dbuxExtension.showMsg', rootEvent, []),
        ]
        log('Sucessfully construct children')
        for (let child of children) {
            log(child.get())
            rootEvent.pushChild(child)
        }
        log('Sucessfully construct rootEvent')
        return [rootEvent]
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    update(data) {
        this.contextData = this.dataProvider.collections.executionContexts.getAll()
        log('dataProvider called update function.')
        this.treeData = this.parseData(this.contextData())
        this.refresh()
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
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

export class Event extends vscode.TreeItem {

	constructor(label, position, collapsibleState, command, parent, children) {
        super(label, collapsibleState);
        this.lable = label;
        this.position = position;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.parent = parent;
        this.children = children;
        this.contextValue = 'event';
		this.iconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
		};
	}

    pushChild(child){
        this.children.push(child);
    }

    get(){
        return {
            'label': this.label,
            'position': this.position,
            'collapsibleState': this.collapsibleState,
            'command': this.command, 
            'parent': this.parent.label,
            'children': this.children.map(e => e.label),
            'contextValue': this.contextValue
        }
    }

	get tooltip() {
		return `at ${this.position}(tooltip)`;
	}

	get description() {
		return "(description)";
	}

}
