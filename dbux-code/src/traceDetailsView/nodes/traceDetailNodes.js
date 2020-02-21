import { TreeItemCollapsibleState, TreeItem } from 'vscode';
import omit from 'lodash/omit';
import TraceType, { hasValue } from 'dbux-common/src/core/constants/TraceType';
import Application from 'dbux-data/src/applications/Application';
import allApplications from 'dbux-data/src/applications/allApplications';
import tracePlayback from 'dbux-data/src/playback/tracePlayback';
import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';
import { getTraceCreatedAt } from 'dbux-data/src/helpers/traceLabels';
import { makeTreeItems } from '../../helpers/treeViewHelpers';
import BaseNode from './BaseNode';
import TraceNode from './TraceNode';


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
// Debug
// ###########################################################################

export class DebugTDNode extends TraceDetailNode {
  init(trace) {
    this.trace = trace;
    this.description = `id: ${trace.traceId}`;
  }

  static makeTraceDetail(trace, application: Application, parent) {
    return trace;
  }

  static makeLabel(trace, application: Application, parent) {
    return 'Debug';
  }

  // static makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }

  makeChildren() {
    const { trace, application } = this;
    const { dataProvider } = application;

    const {
      contextId,
      staticTraceId,
      ...otherTraceProps
    } = trace;

    const context = dataProvider.collections.executionContexts.getById(contextId);
    const staticTrace = dataProvider.collections.staticTraces.getById(staticTraceId);
    const { staticContextId } = staticTrace;
    const staticContext = dataProvider.collections.staticContexts.getById(staticContextId);

    return makeTreeItems(
      ['trace', otherTraceProps],
      [`context`, context],
      ['staticTrace', omit(staticTrace, 'loc')],
      ['staticContext', omit(staticContext, 'loc')]
    );
  }
}

// ###########################################################################
// StaticTrace
// ###########################################################################

export class StaticTraceTDNode extends TraceDetailNode {
  static makeTraceDetail(trace, application: Application, parent) {
    return trace;
    // const { staticTraceId } = trace;
    // const { dataProvider } = application;
    // return dataProvider.collections.staticTraces.getById(staticTraceId);
  }

  static makeLabel(trace, application: Application, parent) {
    const { staticTraceId } = trace;
    const { dataProvider } = application;
    const traces = dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);
    return `Executed: ${traces.length}x`;
  }
  
  makeChildren() {
    const { treeDataProvider, trace } = this;
    const { staticTraceId } = trace;

    const application = allApplications.getById(trace.applicationId);
    const { dataProvider } = application;
    const staticTrace = dataProvider.collections.staticTraces.getById(staticTraceId);
    const traces = dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);

    // TODO: value nodes
    // TODO: Push/Pop traces?
    // TODO: callback args?
    // TODO: loop start nodes?

    if (hasValue(staticTrace.type)) {
      return traces?.map(otherTrace => {
        const label = dataProvider.util.getTraceValue(otherTrace.traceId) + ' ';
        return treeDataProvider.createNode(TraceNode, otherTrace, application, this, null, label);
      }) || null;
    }
    return null;
  }
}


// ###########################################################################
// DetailNodeClasses
// ###########################################################################

export const DetailNodeClasses = [
  ApplicationTDNode,
  ContextTDNode,
  TypeTDNode,
  StaticTraceTDNode,
  // ValueTDNode,
  DebugTDNode
];

// ###########################################################################
// Navigation nodes
// ###########################################################################

export class NavigationTDNode extends TraceDetailNode {
  init() {
    this.collapsibleState = TreeItemCollapsibleState.None;

    if (this.targetTrace) {
      // NOTE: description MUST be a string or it won't be properly displayed
      const dt = getTraceCreatedAt(this.targetTrace.traceId, this.application);
      this.description = dt + '';
    }
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
