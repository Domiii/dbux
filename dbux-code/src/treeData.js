const vscode = require('vscode');
const path = require('path');

// import * as vscode from 'vscode';
// import * as path from 'path';

console.log(`Running treeData.js with __dirname ${__dirname}`)

export class EventNodeProvider {

    constructor(data) {
        this.data = data;
        this.treeData = this.parseData(data)
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    parseData(arrData){
        const collapsibleState = vscode.TreeItemCollapsibleState
        let children = [
            new Event('Push meow()', 'index.js', collapsibleState.None, 'dbuxExtension.showMsg', []),
            new Event('Pop meow()', 'index.js', collapsibleState.None, 'dbuxExtension.showMsg', []),
        ]
        let rootEvent = new Event("Push index.js", "index.js", collapsibleState.Expanded, 'dbuxExtension.showMsg', children)
        return [rootEvent]
    }
    refresh() { 
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element){
            return Promise.resolve(element.children)
        }
        else {
            return Promise.resolve(this.treeData)
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
    set data(arrData){
        this.data = arrData
        this.treeData = this.parseData(arrData)
        this.refresh()
    }
}

export class Event extends vscode.TreeItem {

	constructor(label, position, collapsibleState, command, children) {
        super(label, collapsibleState);
        this.lable = label;
        this.position = position;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.children = children;
        this.contextValue = 'event';
		this.iconPath = {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
		};
	}

	get tooltip() {
		return `at ${this.position}(tooltip)`;
	}

	get description() {
		return "(description)";
	}

}
