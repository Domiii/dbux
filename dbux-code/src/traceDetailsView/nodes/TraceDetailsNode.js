import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import Application from 'dbux-data/src/applications/Application';
import Trace from 'dbux-common/src/core/data/Trace';
import traceSelection from 'dbux-data/src/traceSelection';
import { makeTraceLabel } from 'dbux-data/src/helpers/traceLabels';


export class BaseNode extends TreeItem {
  application: Application;
  parent;
  children: BaseNode[] = null;

  constructor(label, iconPath, application, parent, id, moreProps) {
    super(label);

    this.application = application;
    this.parent = parent;
    this.id = id;

    // treeItem data
    this.contextValue = 'detailsBaseNode';

    this.iconPath = iconPath;

    // more custom props for this node
    Object.assign(this, moreProps);
  }

  _handleClick() {
    // by default: do nothing
  }

  get nodeType() {
    return this.constructor.nodeType;
  }
}

export class EmptyNode extends BaseNode {
  constructor() {
    super('(no trace at cursor)');

    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  // singleton
  static get instance() {
    return EmptyNode._instance = (EmptyNode._instance || new EmptyNode());
  }
}

// export class StaticTraceNode extends BaseNode {
//   init(staticTrace) {
//     this.staticTrace = staticTrace;
//     this.collapsibleState = TreeItemCollapsibleState.Expanded;
//   }

//   static get nodeType() {
//     return TraceDetailsNodeType.StaticTrace;
//   }

//   static makeLabel(staticTrace: StaticTrace) {
//     // TODO: fix this up a bit for trace that don't have a name
//     return staticTrace.displayName || TraceType.nameFrom(staticTrace.type);
//   }

//   static makeIconPath(staticTrace: StaticTrace) {
//     return 'string.svg';
//   }
// }

export class TraceNode extends BaseNode {
  init(trace) {
    this.trace = trace;
    this.collapsibleState = TreeItemCollapsibleState.None;

    // description
    const { createdAt, dataProvider } = this.application;
    const context = dataProvider.util.getTraceContext(trace.traceId);
    const dt = (context.createdAt - createdAt) / 1000;
    // NOTE: description MUST be a string or it won't be properly displayed
    const description = dt + '';
    this.description = description;
  }

  _handleClick() {
    traceSelection.selectTrace(this.trace);
  }

  static makeLabel(trace: Trace, application: Application) {
    return makeTraceLabel(trace, application);
  }

  static makeIconPath(trace: Trace) {
    return 'string.svg';
  }
}

export class SelectedTraceNode extends TraceNode {
  init(trace) {
    super.init(trace);

    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  static makeLabel(trace: Trace, application: Application) {
    const label = TraceNode.makeLabel(trace, application);

    return `${label}`;
  }

  static makeIconPath(trace: Trace) {
    return 'play.svg';
  }
}