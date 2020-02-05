import { TreeItem } from 'vscode';
import TraceDetailsNodeType from './TraceDetailsNodeType';

export class TraceDetailsNode extends TreeItem {
  application;
  parent;
  children = null;

  constructor(label, application, parent) {
    super(label);
    
    this.application = application;
    this.parent = parent;
  }

  get nodeType() {
    return this.constructor.nodeType;
  }
}

export class TraceDetailsApplicationNode extends TraceDetailsNode {
  init(application) {
    this.application = application;
  }
  
  static get nodeType() {
    return TraceDetailsNodeType.StaticTrace;
  }
  
  static makeLabel(application) {
    return application.relativeEntryPointPath;
  }
}

export class TraceDetailsStaticTraceNode extends TraceDetailsNode {
  init(staticTrace) {
    this.staticTrace = staticTrace;
  }

  static get nodeType() {
    return TraceDetailsNodeType.StaticTrace;
  }
  
  static makeLabel(staticTrace) {
    
  }
}

export class TraceDetailsTraceNode extends TraceDetailsNode {
  init(trace) {
    this.trace = trace;
  }

  static get nodeType() {
    return TraceDetailsNodeType.Trace;
  }
  
  static makeLabel(trace, application, parent) {
    
  }
}

export function makeTraceDetailsNode(NodeClass, entry, application, parent) {
  const label = NodeClass.makeLabel(entry, application, parent);
  const node = new NodeClass(label, application, parent);
  node.init(entry);
  return node;
}