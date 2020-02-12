import { TreeItemCollapsibleState } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import Application from 'dbux-data/src/applications/Application';
import traceSelection from 'dbux-data/src/traceSelection';
import allApplications from 'dbux-data/src/applications/allApplications';
import tracePlayback from 'dbux-data/src/playback/tracePlayback';
import TraceDetailsNodeType from '../TraceDetailsNodeType';
import { BaseNode } from './TraceDetailsNode';


// →↓←↑

function renderNextTraceArrow(trace, nextTrace) {
  const { contextId: context } = trace;
  const { contextId: nextContext } = nextTrace;

  if (nextContext < context) {
    // next context is a parent -> step out
    return '↑';
  }
  else if (nextContext > context) {
    // next context is a child -> step into
    return '↓';
  }
  else {
    // same context
    return '→';
  }
}

function renderPreviousTraceArrow(trace, previousTrace) {
  const { contextId: context } = trace;
  const { contextId: previousContext } = previousTrace;

  if (previousContext < context) {
    // previous context is a parent -> step out
    return '↑';
  }
  else if (previousContext > context) {
    // previous context is a child -> step into
    return '↓';
  }
  else {
    // same context
    return '←';
  }
}

export class TraceDetailNode extends BaseNode {
  init(traceDetail) {
    this.traceDetail = traceDetail;
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  static get nodeType() {
    return TraceDetailsNodeType.TraceDetail;
  }
}

// ###########################################################################
// Application
// ###########################################################################

export class ApplicationTDNode extends TraceDetailNode {
  init(application) {
    this.application = application;
    this.collapsibleState = TreeItemCollapsibleState.Expanded;
  }

  _handleClick() {
    // TODO: go to Application's first trace
    // goToTrace(firstTrace);
  }

  static makeTraceDetail(trace, application) {
    const fpath = application.dataProvider.util.getTraceFilePath(trace.traceId);
    if (allApplications.selection.data.getApplicationCountAtPath(fpath) < 2) {
      return null;
    }
    return application;
  }

  static makeLabel(application: Application) {
    return application.getRelativeFolder();
  }

  // static makeIconPath(application: Application) {
  //   return 'string.svg';
  // }
}

// ###########################################################################
// Type
// ###########################################################################

export class TypeTDNode extends TraceDetailNode {
  init(trace) {
    this.trace = trace;
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  static get nodeType() {
    return TraceDetailsNodeType.NextContextTraceDetail;
  }

  static makeTraceDetail(trace, application: Application, parent) {
    return trace;
  }

  static makeLabel(trace, application: Application, parent) {
    const traceType = application.dataProvider.util.getTraceType(trace.traceId);
    const typeName = TraceType.nameFrom(traceType);
    return `Type: ${typeName}`;
  }

  // static makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }
}

// ###########################################################################
// Value
// ###########################################################################

export class ValueTDNode extends TraceDetailNode {
  init(trace) {
    this.trace = trace;
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  static get nodeType() {
    return TraceDetailsNodeType.Value;
  }

  static makeTraceDetail(trace, application: Application, parent) {
    const { traceId } = trace;
    const { dataProvider } = application;
    const hasValue = dataProvider.util.doesTraceHaveValue(traceId);
    return hasValue ? trace : null;
  }

  static makeLabel(trace, application: Application, parent) {
    const { traceId } = trace;
    const { dataProvider } = application;
    const value = dataProvider.util.getTraceValue(traceId);
    return `Value: ${value}`;
  }

  // static makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }
}

// ###########################################################################
// Navigation nodes
// ###########################################################################

export class NavigationTDNode extends TraceDetailNode {
  init() {
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  static getTargetTrace(controlName) {
    return tracePlayback[`get${controlName}`] && tracePlayback[`get${controlName}`]();
  }

  _handleClick() {
    tracePlayback[`goto${this.constructor.controlName}`] && tracePlayback[`goto${this.constructor.controlName}`]();
  }
}

export const NavigationNodeClasses = [
  class NextInContext extends NavigationTDNode {
    static get controlName() {
      return 'NextInContext';
    }

    static makeArrow() {
      return '→';
    }
  },
  
  class NextChildContext extends NavigationTDNode {
    static get controlName() {
      return 'NextChildContext';
    }

    static makeArrow() {
      return '↘';
    }
  },
  
  class PreviousChildContext extends NavigationTDNode {
    static get controlName() {
      return 'PreviousChildContext';
    }

    static makeArrow() {
      return '↙';
    }
  },
  
  class PreviousInContext extends NavigationTDNode {
    static get controlName() {
      return 'PreviousInContext';
    }

    static makeArrow() {
      return '←';
    }
  },
  
  class PreviousParentContext extends NavigationTDNode {
    static get controlName() {
      return 'PreviousParentContext';
    }

    static makeArrow() {
      return '↖';
    }
  },
  
  class NextParentContext extends NavigationTDNode {
    static get controlName() {
      return 'NextParentContext';
    }

    static makeArrow() {
      return '↗';
    }
  }
];


export class NextTraceTDNode extends TraceDetailNode {
  init(nextTrace) {
    this.nextTrace = nextTrace;
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  _handleClick() {
    traceSelection.selectTrace(this.nextTrace);
  }

  static get nodeType() {
    return TraceDetailsNodeType.NextContextTraceDetail;
  }

  static makeTraceDetail(trace, application: Application, parent) {
    const { traceId, contextId } = trace;
    const nextTrace = application.dataProvider.util.getNextTrace(traceId);
    if (!nextTrace) { // || nextTrace.contextId === contextId) {
      return null;
    }
    return nextTrace;
  }

  static makeLabel(nextTrace, application: Application, parent) {
    const staticContext = application.dataProvider.util.getTraceStaticContext(nextTrace.traceId);
    const { displayName } = staticContext;
    const arrow = renderNextTraceArrow(parent.trace, nextTrace);
    return `${arrow} ${displayName}`;
  }

  // static makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }
}