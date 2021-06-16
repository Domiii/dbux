import allApplications from '@dbux/data/src/applications/allApplications';
import { makeContextLabel } from '@dbux/data/src/helpers/contextLabels';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import ExecutionContextType from '@dbux/common/src/core/constants/ExecutionContextType';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

// ###########################################################################
// Info: Application
// ###########################################################################

export class ApplicationTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace) {
    const application = allApplications.getApplication(trace.applicationId);
    const fpath = application.dataProvider.util.getTraceFilePath(trace.traceId);
    if (allApplications.selection.data.getApplicationCountAtPath(fpath) < 2) {
      return null;
    }
    return application;
  }

  /**
   * @param {Application} application 
   */
  static makeLabel(application) {
    return `${application.getRelativeFolder()} [Application]`;
  }

  get application() {
    return this.entry;
  }

  handleClick() {
    // TODO: go to Application's first trace?
    // goToTrace(firstTrace);
  }

  // makeIconPath() {
  //   return 'string.svg';
  // }
}

// ###########################################################################
// Info: Context
// ###########################################################################

export class ContextTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace) {
    const application = allApplications.getApplication(trace.applicationId);
    return application.dataProvider.util.getTraceContext(trace.traceId);
  }

  static makeLabel(context, parent) {
    const application = allApplications.getApplication(parent.trace.applicationId);
    const { contextType } = context;
    const typeName = ExecutionContextType.nameFrom(contextType);
    return `Context: ${makeContextLabel(context, application)} [${typeName}]`;
  }

  // makeIconPath(application: Application) {
  //   return 'string.svg';
  // }
}

// ###########################################################################
// Info: TraceType
// ###########################################################################

export class TraceTypeTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace) {
    return trace;
  }

  static makeLabel(trace) {
    const application = allApplications.getApplication(trace.applicationId);
    const traceType = application.dataProvider.util.getTraceType(trace.traceId);
    const typeName = TraceType.nameFrom(traceType);
    return `TraceType: ${typeName}`;
  }

  // makeIconPath(traceDetail) {
  //   return 'string.svg';
  // }
}


// ###########################################################################
// Info
// ###########################################################################

export class InfoTDNode extends BaseTreeViewNode {
  static makeTraceDetail(trace) {
    return trace;
  }

  static makeLabel() {
    return 'Info';
  }

  buildChildren() {
    return this.treeNodeProvider.buildDetailNodes(this.trace, this.nodeId, this, [
      ApplicationTDNode,
      ContextTDNode,
      TraceTypeTDNode,
    ]);
  }
}