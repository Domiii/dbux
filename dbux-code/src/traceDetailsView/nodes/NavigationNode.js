import tracePlayback from 'dbux-data/src/playback/tracePlayback';
import traceSelection from 'dbux-data/src/traceSelection';
import { newLogger } from 'dbux-common/src/log/logger';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

const { log, debug, warn, error: logError } = newLogger('NavigationNode');

const NavigationMethods = [
  'NextInContext',
  'NextChildContext',
  'NextParentContext',
  'PreviousInContext',
  'PreviousChildContext',
  'PreviousParentContext'
];

// must match with NavigationMethods
const defaultMethods = {
  NextInContext: 'NextTrace',
  NextChildContext: 'NextTrace',
  NextParentContext: 'NextTrace',
  PreviousInContext: 'PreviousTrace',
  PreviousChildContext: 'PreviousTrace',
  PreviousParentContext: 'PreviousTrace'
};

export { NavigationMethods };

export default class NavigationNode extends BaseTreeViewNode {
  static makeLabel(trace, parent) {
    return '';
  }

  get trace() {
    return this.entry;
  }

  init() {
    this.contextValue = 'dbuxTraceDetailsView.navigationNode';
  }

  canHaveChildren() {
    return false;
  }

  findTargetTrace(methodName, trace = this.trace) {
    const targetTrace = tracePlayback[`get${methodName}`]?.(trace);

    // find default target if target not found
    return targetTrace || this.findDefaultTargetTrace(methodName, trace);
  }

  findDefaultTargetTrace(methodName, trace) {
    const defaultMethodName = defaultMethods[methodName];
    const defaultTarget = tracePlayback[`get${defaultMethodName}`]?.(trace);
    if (!defaultTarget) {
      logError(`can't get${defaultMethodName} of traceId${trace.traceId}`);
      return trace;
    }
    return defaultTarget;
  }

  select(methodName) {
    traceSelection.selectTrace(this.findTargetTrace(methodName));
  }
}