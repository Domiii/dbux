import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import Application from 'dbux-data/src/applications/Application';
import Trace from 'dbux-common/src/core/data/Trace';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { EmptyObject } from 'dbux-common/src/util/arrayUtil';
import TraceDetailsNodeType from '../TraceDetailsNodeType';
import { getThemeResourcePath } from '../../resources';
import { goToTrace } from '../../codeNav';

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
    this.command = {
      command: 'dbuxTraceDetailsView.itemClick',
      arguments: [this]
    };

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

export class ApplicationNode extends BaseNode {
  init(application) {
    this.application = application;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  _handleClick() {
    // TODO: go to Application's first trace
    // goToTrace(firstTrace);
  }

  static get nodeType() {
    return TraceDetailsNodeType.StaticTrace;
  }

  static makeLabel(application: Application) {
    return application.getRelativeFolder();
  }

  // static makeIconPath(application: Application) {
  //   return 'string.svg';
  // }
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
    this.collapsibleState = TreeItemCollapsibleState.Expanded;

    // description
    const { createdAt, dataProvider } = this.application;
    const context = dataProvider.util.getTraceContext(trace.traceId);
    const dt = (context.createdAt - createdAt) / 1000;
    // NOTE: description MUST be a string or it won't be properly displayed
    const description = dt + '';
    this.description = description;
  }

  _handleClick() {
    goToTrace(this.trace);
  }

  static get nodeType() {
    return TraceDetailsNodeType.Trace;
  }

  static makeLabel(trace: Trace, application: Application) {
    const {
      traceId,
      staticTraceId
    } = trace;
    const staticTrace = application.dataProvider.collections.staticTraces.getById(staticTraceId);
    const {
      displayName
    } = staticTrace;
    const traceType = application.dataProvider.util.getTraceType(traceId);
    const typeName = TraceType.nameFrom(traceType);
    const title = displayName || `[${typeName}]`;
    return `${title}`;
  }

  static makeIconPath(trace: Trace) {
    return 'string.svg';
  }
}


let _lastId = 0;

export function createTraceDetailsNode(
  NodeClass, entry, application, parent, treeItemProps = EmptyObject): BaseNode {
  const label = NodeClass.makeLabel(entry, application, parent);
  const relativeIconPath = NodeClass.makeIconPath && NodeClass.makeIconPath(entry, application, parent);
  const iconPath = relativeIconPath && getThemeResourcePath(relativeIconPath) || null;
  const id = (++_lastId) + '';
  const node = new NodeClass(label, iconPath, application, parent, id, treeItemProps);
  node.init(entry);
  return node;
}


export function tryCreateTraceDetailNode(NodeClass, trace, application, parent) {
  const detail = NodeClass.makeTraceDetail(trace, application, parent);
  if (!detail) {
    return null;
  }
  const treeItemProps = {
    trace
  };
  return createTraceDetailsNode(NodeClass, detail, application, parent, treeItemProps);
}