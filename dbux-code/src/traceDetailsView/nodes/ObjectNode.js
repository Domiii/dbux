import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import TraceNode from './TraceNode';

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
}