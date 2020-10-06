import { emitPracticeSelectTraceAction } from '../../userEvents';
import TraceNode from './TraceNode';

export default class TraceByStaticTraceNode extends TraceNode {
  handleClick() {
    emitPracticeSelectTraceAction('selectInStaticTrace', this.trace);
    super.handleClick();
  }
}