import GraphHostCommands from 'dbux-graph-host/src/GraphHostCommands';
import traceSelection from 'dbux-data/src/traceSelection';
import allApplications from 'dbux-data/src/applications/allApplications';

/**
 * Provide commands for Client to do stuff on Host.
 */
export default class GraphCommands extends GraphHostCommands {
  constructor(graph) {
    super(graph);
  }

  selectTrace(applicationId, traceId) {
    const trace = allApplications.selection.data.getTrace(applicationId, traceId);
    traceSelection.selectTrace(trace);
  }
}