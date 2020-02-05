import { TreeItem } from 'vscode';
import TraceDetailsNodeType from './TraceDetailsNodeType';

export class TraceDetailsNode extends TreeItem {
  application;
  parent;
  children = null;

  constructor(label) {
    super(label);
  }

  init(application, parent) {
    this.application = application;
    this.parent = parent;
  }
}

export class TraceDetailsApplicationNode extends TraceDetailsNode {
  constructor(application) {
    super(TraceDetailsApplicationNode.makeLabel(application));
  }
  
  get nodeType() {
    return TraceDetailsNodeType.StaticTrace;
  }
  
  static makeLabel(application) {
    return application.relativeEntryPointPath;
  }
}

export class TraceDetailsStaticTraceNode extends TraceDetailsNode {
  constructor(staticTrace) {
    super(TraceDetailsStaticTraceNode.makeLabel(staticTrace));
    this.staticTrace = staticTrace;
  }
  
  get nodeType() {
    return TraceDetailsNodeType.StaticTrace;
  }
  
  static makeLabel(staticTrace) {
    
  }
}

export class TraceDetailsTraceNode extends TraceDetailsNode {
  constructor(trace) {
    super();
    this.trace = trace;
  }

  get nodeType() {
    return TraceDetailsNodeType.Trace;
  }
}

export function makeTraceDetailsNode(NodeClass, entry, application, parent) {
  const node = new NodeClass(entry);
  node.init(application, parent);
  return node;
}