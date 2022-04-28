import { makeTraceValueLabel } from '@dbux/data/src/helpers/makeLabels';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import allApplications from '@dbux/data/src/applications/allApplications';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { emitSelectTraceAction } from '../../userEvents';
import TraceNode from '../../codeUtil/treeView/TraceNode';
import TraceContainerNode, { UngroupedNode } from '../../codeUtil/treeView/TraceContainerNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * Leaf Node
 *  #########################################################################*/

class ExecutionNode extends TraceNode {
  /**
   * @param {Trace} 
   */
  static makeLabel(trace) {
    return makeTraceValueLabel(trace);
    // return makeTraceLabel(trace);
  }

  handleClick() {
    super.handleClick();
    emitSelectTraceAction(this.trace, UserActionType.TDExecutionsTraceUse);
  }
}

// ###########################################################################
//  ExecutionTDNode
// ###########################################################################

export const ExecutionsTDNodeContextValue = 'dbuxTraceDetailsView.node.executionsTDNodeRoot#traceContainer';

export default class ExecutionsTDNode extends TraceContainerNode {
  static labelPrefix = 'Executions';
  static TraceNodeClass = ExecutionNode;

  static getAllTraces(trace) {
    const { applicationId, staticTraceId } = trace;
    const application = allApplications.getById(applicationId);
    const dp = application.dataProvider;
    const traces = dp.indexes.traces.byStaticTrace.get(staticTraceId);
    return traces;
  }

  get collapseChangeUserActionType() {
    return UserActionType.TDExecutionsUse;
  }

  init() {
    super.init();
    this.contextValue = ExecutionsTDNodeContextValue;
  }

  getSelectedChild() {
    if (ExecutionsTDNode.getCurrentGroupClass() === UngroupedNode) {
      return this.children?.find(node => node.isSelected());
    }
    else {
      for (const groupNode of this.children) {
        for (const executionNode of groupNode.children || EmptyArray) {
          if (executionNode.isSelected()) {
            return executionNode;
          }
        }
      }
      return null;
    }
  }
}
