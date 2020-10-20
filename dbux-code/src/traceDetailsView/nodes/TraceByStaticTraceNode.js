import UserActionType from '@dbux/data/src/pathways/UserActionType';
import { emitPracticeSelectTraceAction } from '../../userEvents';
import TraceNode from './TraceNode';

export default class TraceByStaticTraceNode extends TraceNode {
  get clickUserActionType() {
    return UserActionType.TDTrackObjectTraceUse;
  }

  handleClick() {
    emitPracticeSelectTraceAction('selectInStaticTrace', this.trace);
    super.handleClick();
  }
}