import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import { emitSelectTraceAction } from '../../userEvents';
import TraceNode from '../../codeUtil/treeView/TraceNode';

export default class ObjectNode extends TraceNode {
  makeIconPath() {
    const { selected } = traceSelection;
    if (selected) {
      const dp = allApplications.getById(selected.applicationId).dataProvider;
      if (this.trace === dp.util.getValueTrace(selected.traceId)) {
        return 'play.svg';
      }
    }
    return ' ';
  }

  handleClick() {
    super.handleClick();
    emitSelectTraceAction(this.trace, UserActionType.TDTrackObjectTraceUse);
  }
}