import Trace from '@dbux/common/src/core/data/Trace';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeTraceLabel, makeTraceLocLabel } from '@dbux/data/src/helpers/traceLabels';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';

export default class TraceNode extends BaseTreeViewNode {
  /**
   * @param {Trace} 
   */
  static makeLabel(trace) {
    return makeTraceLabel(trace);
  }

  get trace() {
    return this.entry;
  }

  makeIconPath() {
    return traceSelection.isSelected(this.trace) ? 'play.svg' : ' ';
  }

  init() {
    // description
    // NOTE: description MUST be a string or it won't be properly displayed
    // const dt = getTraceCreatedAt(this.trace);
    const loc = makeTraceLocLabel(this.trace);
    this.description = loc;
    this.clickUserActionType = UserActionType.TDTraceUse;
  }

  handleClick() {
    traceSelection.selectTrace(this.trace);
  }
}