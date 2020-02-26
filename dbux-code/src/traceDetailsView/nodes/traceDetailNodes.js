import { TreeItemCollapsibleState, TreeItem } from 'vscode';
import omit from 'lodash/omit';
import TraceType, { hasTraceTypeValue } from 'dbux-common/src/core/constants/TraceType';
import Application from 'dbux-data/src/applications/Application';
import allApplications from 'dbux-data/src/applications/allApplications';
import tracePlayback from 'dbux-data/src/playback/tracePlayback';
import { makeContextLabel } from 'dbux-data/src/helpers/contextLabels';
import { getTraceCreatedAt } from 'dbux-data/src/helpers/traceLabels';
import { makeTreeItems } from '../../helpers/treeViewHelpers';
import TraceNode from './TraceNode';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';


function renderTargetTraceArrow(trace, targetTrace, originalArrow) {
  const { contextId } = trace;
  const { contextId: targetContextId } = targetTrace;

  if (targetContextId < contextId) {
    // target context is a parent -> step out
    return '↑';
  }
  else if (targetContextId > contextId) {
    // target context is a child -> step into
    return '↓';
  }
  else {
    return originalArrow;
  }
}

export class TraceDetailNode extends BaseTreeViewNode {
}

// ###########################################################################
// Value
// ###########################################################################

export class ValueTDNode extends TraceDetailNode {
  static makeTraceDetail(trace, parent) {
    const application = allApplications.getApplication(trace.applicationId);
    const { traceId } = trace;
    const { dataProvider } = application;
    const hasValue = dataProvider.util.doesTraceHaveValue(traceId);
    return hasValue ? trace : null;
  }

  static makeLabel(trace, parent) {
    const application = allApplications.getApplication(trace.applicationId);
    const { traceId } = trace;
    const { dataProvider } = application;
    const value = dataProvider.util.getTraceValue(traceId);
    return `Value: ${value}`;
  }

  // makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }
}

// ###########################################################################
// StaticTrace
// ###########################################################################

export class StaticTraceTDNode extends TraceDetailNode {
  static makeTraceDetail(trace, parent) {
    return trace;
    // const { staticTraceId } = trace;
    // const { dataProvider } = application;
    // return dataProvider.collections.staticTraces.getById(staticTraceId);
  }

  static makeLabel(trace, parent) {
    const { staticTraceId } = trace;

    const application = allApplications.getApplication(trace.applicationId);
    const { dataProvider } = application;
    const traces = dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);
    return `Executed: ${traces.length}x`;
  }

  get defaultCollapsibleState() {
    return TreeItemCollapsibleState.Expanded;
  }

  buildChildren() {
    const { treeNodeProvider, trace } = this;
    const { staticTraceId } = trace;

    const application = allApplications.getById(trace.applicationId);
    const { dataProvider } = application;
    const staticTrace = dataProvider.collections.staticTraces.getById(staticTraceId);
    const traces = dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);

    // TODO: value nodes
    // TODO: Push/Pop traces?
    // TODO: callback args?
    // TODO: loop start nodes?

    const staticType = staticTrace.type;
    if (hasTraceTypeValue(staticType)) {
      return traces?.map(otherTrace => {
        const valueString = dataProvider.util.getTraceValue(otherTrace.traceId) + ' ';
        let label;
        if (staticType === TraceType.CallExpressionResult) {
          const anchorId = otherTrace.resultCallId;
          const args = dataProvider.indexes.traces.callArgsByCall.get(anchorId);
          const argValues = args?.
            map(argTrace => dataProvider.util.getTraceValue(argTrace.traceId)) || 
            EmptyArray;
          label = `(${argValues.join(', ')}) -> ${valueString}`;
        }
        else {
          label = valueString;
        }
        return new TraceNode(treeNodeProvider, label, otherTrace, this);
      }) || null;
    }
    return null;
  }
}

// ###########################################################################
// Info: Application
// ###########################################################################

export class ApplicationTDNode extends TraceDetailNode {
  static makeTraceDetail(trace) {
    const application = allApplications.getApplication(trace.applicationId);
    const fpath = application.dataProvider.util.getTraceFilePath(trace.traceId);
    if (allApplications.selection.data.getApplicationCountAtPath(fpath) < 2) {
      return null;
    }
    return application;
  }

  static makeLabel(application: Application) {
    return `${application.getRelativeFolder()} [Application]`;
  }

  get application() {
    return this.entry;
  }

  handleClick() {
    // TODO: go to Application's first trace
    // goToTrace(firstTrace);
  }

  // makeIconPath() {
  //   return 'string.svg';
  // }
}

// ###########################################################################
// Info: Context
// ###########################################################################

export class ContextTDNode extends TraceDetailNode {
  static makeTraceDetail(trace) {
    const application = allApplications.getApplication(trace.applicationId);
    return application.dataProvider.util.getTraceContext(trace.traceId);
  }

  static makeLabel(context, parent) {
    const application = allApplications.getApplication(parent.trace.applicationId);
    return `${makeContextLabel(context, application)} [Context]`;
  }

  // makeIconPath(application: Application) {
  //   return 'string.svg';
  // }
}

// ###########################################################################
// Info: TraceType
// ###########################################################################

export class TraceTypeTDNode extends TraceDetailNode {
  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeLabel(trace, parent) {
    const application = allApplications.getApplication(trace.applicationId);
    const traceType = application.dataProvider.util.getTraceType(trace.traceId);
    const typeName = TraceType.nameFrom(traceType);
    return `${typeName} [TraceType]`;
  }

  // makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }
}


// ###########################################################################
// Info
// ###########################################################################

export class InfoTDNode extends TraceDetailNode {
  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeLabel() {
    return 'Info';
  }

  buildChildren() {
    return this.treeNodeProvider.buildDetailNodes(this.trace, this, [
      ApplicationTDNode,
      ContextTDNode,
      TraceTypeTDNode,
    ]);
  }
}

// ###########################################################################
// Debug
// ###########################################################################

export class DebugTDNode extends TraceDetailNode {
  static makeTraceDetail(trace, parent) {
    return trace;
  }

  static makeLabel(trace, parent) {
    return 'Debug';
  }

  init() {
    this.description = `id: ${this.trace.traceId}`;
  }

  // makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }

  buildChildren() {
    const { trace } = this;

    const application = allApplications.getApplication(trace.applicationId);
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

    const children = makeTreeItems(
      ['trace', otherTraceProps],
      [`context`, context],
      ['staticTrace', omit(staticTrace, 'loc')],
      ['staticContext', omit(staticContext, 'loc')]
    );

    return children;
  }
}

// ###########################################################################
// DetailNodeClasses
// ###########################################################################

export const DetailNodeClasses = [
  StaticTraceTDNode,
  InfoTDNode,
  // ValueTDNode,
  DebugTDNode
];

// ###########################################################################
// Navigation nodes
// ###########################################################################

export class NavigationTDNode extends TraceDetailNode {
  static getTargetTrace(controlName) {
    return tracePlayback[`get${controlName}`] && tracePlayback[`get${controlName}`]();
  }

  init() {
    if (this.targetTrace) {
      // NOTE: description MUST be a string or it won't be properly displayed
      const dt = getTraceCreatedAt(this.targetTrace);
      this.description = dt + '';

      // goto callback
      this.gotoCb = tracePlayback[`goto${this.constructor.controlName}`].bind(tracePlayback);
    }
  }

  handleClick() {
    this.gotoCb?.();
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
