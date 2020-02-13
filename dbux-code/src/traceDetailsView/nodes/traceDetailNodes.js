import { TreeItemCollapsibleState } from 'vscode';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import Application from 'dbux-data/src/applications/Application';
import allApplications from 'dbux-data/src/applications/allApplications';
import tracePlayback from 'dbux-data/src/playback/tracePlayback';
import TraceDetailsNodeType from '../TraceDetailsNodeType';
import { BaseNode } from './TraceDetailsNode';
import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';


function renderTargetTraceArrow(trace, targetTrace, originalArrow) {
  const { contextId } = trace;
  const { contextId: targetContextId } = targetTrace;

  if (targetContextId < contextId) {
    // next context is a parent -> step out
    return '↑';
  }
  else if (targetContextId > contextId) {
    // next context is a child -> step into
    return '↓';
  }
  else {
    return originalArrow;
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
    this.collapsibleState = TreeItemCollapsibleState.None;
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
// Context
// ###########################################################################

export class ContextTDNode extends TraceDetailNode {
  init(context) {
    this.context = context;
    this.collapsibleState = TreeItemCollapsibleState.None;
  }

  static makeTraceDetail(trace, application) {
    return application.dataProvider.util.getTraceContext(trace.traceId);
  }

  static makeLabel(context, application: Application) {
    return makeContextLabel(context, application);
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

export const DetailNodeClasses = [
  ApplicationTDNode,
  ContextTDNode,
  TypeTDNode,
  ValueTDNode
];

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
  class NextParentContext extends NavigationTDNode {
    static get controlName() {
      return 'NextParentContext';
    }

    static makeArrow(trace, targetTrace) {
      return renderTargetTraceArrow(trace, targetTrace, '↗');
    }
  },

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

    static makeArrow(trace, targetTrace) {
      return renderTargetTraceArrow(trace, targetTrace, '↘');
    }
  },

  class PreviousChildContext extends NavigationTDNode {
    static get controlName() {
      return 'PreviousChildContext';
    }

    static makeArrow(trace, targetTrace) {
      return renderTargetTraceArrow(trace, targetTrace, '↙');
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

    static makeArrow(trace, targetTrace) {
      return renderTargetTraceArrow(trace, targetTrace, '↖');
    }
  }
];
