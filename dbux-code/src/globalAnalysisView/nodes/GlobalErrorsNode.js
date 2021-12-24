import UserActionType from '@dbux/data/src/pathways/UserActionType';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import TraceContainerNode, { GroupNode } from '../../codeUtil/treeView/TraceContainerNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

class ErrorsGroupNode extends GroupNode {
  static labelPrefix = 'Errors';
}

class ErrorsByContext extends ErrorsGroupNode {
  static labelSuffix = 'by Context';

  static makeKey(_dp, errorTrace) {
    return errorTrace.contextId;
  }

  static makeLabel(_entry, _parent, props) {
    const { applicationId, contextId } = props.key;
    const application = allApplications.getById(applicationId);
    const context = application.dataProvider.collections.executionContexts.getById(contextId);
    return makeContextLabel(context, application);
  }

  static makeDescription() {
    return `ContextId: ${this.key}`;
  }

  static getRelevantTrace(dp, contextId) {
    return dp.util.getFirstTraceOfContext(contextId);
  }
}

/** ###########################################################################
 * {@link GlobalErrorsNode}
 * ##########################################################################*/

export default class GlobalErrorsNode extends TraceContainerNode {
  static GroupClasses = [ErrorsByContext];

  static labelPrefix(/*_, parent*/) {
    return `Errors`;
  }

  get collapseChangeUserActionType() {
    return UserActionType.GlobalErrorUse;
  }
}
