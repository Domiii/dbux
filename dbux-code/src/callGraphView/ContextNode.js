import { TreeItemCollapsibleState as CollapsibleState } from 'vscode';
import allApplications from 'dbux-data/src/applications/allApplications';
import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';

export default class ContextNode {
  constructor(
    applicationId,
    context,
    parent
  ) {
    const app = allApplications.getById(applicationId);
    const trace = app.dataProvider.util.getFirstTraceOfContext(context.contextId);

    // node data
    this.applicationId = applicationId;
    this.traceId = trace?.traceId;
    this.callGraphNodeProvider = parent.callGraphNodeProvider;

    // treeItem data
    this.label = makeContextLabel(context, app);
    this.parentNode = parent;
    this.children = null;
    this.description = '';
    this.tooltip = '';
    this.collapsibleState = CollapsibleState.None;
    this.command = {
      command: 'dbuxCallGraphView.itemClick',
      arguments: [this]
    };
    this.contextValue = 'contextNode';
    this.iconPath = '';
  }
}