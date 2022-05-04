import tracePlayback from '@dbux/data/src/playback/tracePlayback';
import traceSelection from '@dbux/data/src/traceSelection';
import { newLogger } from '@dbux/common/src/log/logger';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';
import { emitNavigationAction } from '../../userActions';
import { showInformationMessage } from '../../codeUtil/codeModals';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('NavigationNode');

const NavigationMethods = [
  'NextInContext',
  'NextChildContext',
  'NextParentContext',
  'PreviousInContext',
  'PreviousChildContext',
  'PreviousParentContext',
  'PreviousStaticTrace',
  'NextStaticTrace',
  'PreviousTrace',
  'NextTrace',
];

// if default method is not provided, it returns null when `findTargetTrace` failed
const defaultMethods = {
  NextInContext: 'NextTrace',
  NextChildContext: 'NextParentContext',
  NextParentContext: 'NextTrace',
  PreviousInContext: 'PreviousTrace',
  PreviousChildContext: 'PreviousParentContext',
  PreviousParentContext: 'PreviousTrace',
};

export { NavigationMethods };

export const NavigationNodeContextValue = 'dbuxTraceDetailsView.navigationNode';

export default class NavigationNode extends BaseTreeViewNode {
  static makeLabel(/* trace, parent */) {
    return '';
  }

  get trace() {
    return this.entry;
  }

  init() {
    this.contextValue = NavigationNodeContextValue;
  }

  canHaveChildren() {
    return false;
  }

  findTargetTrace(methodName, trace = traceSelection.selected) {
    const targetTrace = tracePlayback[`get${methodName}`]?.(trace);

    // find default target if target not found
    return targetTrace || this.findDefaultTargetTrace(methodName, trace);
  }

  findDefaultTargetTrace(methodName, trace) {
    const defaultMethodName = defaultMethods[methodName];
    if (defaultMethodName) {
      const defaultTarget = tracePlayback[`get${defaultMethodName}`]?.(trace);
      return defaultTarget || null;
    }
    else {
      return null;
    }
  }

  select(methodName) {
    // TODO: too many places storing `trace`?
    // const getIds = () => {
    //   return [
    //     traceSelection.selected,
    //     tracePlayback.currentTrace,
    //     this.trace
    //   ].map(t => t?.traceId);
    // };
    // const ids1 = getIds();

    const trace = this.findTargetTrace(methodName);
    if (trace) {
      traceSelection.selectTrace(trace);
      emitNavigationAction(trace, methodName);
    }
    else {
      showInformationMessage(`Can't find "${methodName}" of current trace.`);
    }

    // this.treeNodeProvider.treeView.reveal(this);

    // const ids2 = getIds();
    // debug(`${methodName}: ${ids1} -> ${ids2}`);
  }
}