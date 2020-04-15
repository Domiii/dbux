import allApplications from 'dbux-data/src/applications/allApplications';
import { makeTraceLabel } from 'dbux-data/src/helpers/traceLabels';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

export default class TraceNode extends HostComponentEndpoint {
  init() {
    const {
      trace
    } = this.state;

    const dp = allApplications.getById(trace.applicationId).dataProvider;

    // get name
    this.state.displayName = makeTraceLabel(trace);
  }
}