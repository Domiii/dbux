import UserActionType from '@dbux/data/src/pathways/UserActionType';
import { emitSelectTraceAction } from '../../userEvents';
import TraceNode from './TraceNode';

export default class TraceByStaticTraceNode extends TraceNode {
  handleClick() {
    emitSelectTraceAction(this.trace, UserActionType.TDExecutionsTraceUse);
    super.handleClick();
  }
}