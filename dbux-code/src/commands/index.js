import { initTraceDetailsViewCommands } from './traceDetailsViewCommands';
import { initUserCommands } from './userCommands';
import { initApplicationsViewCommands } from './applicationsViewCommands';
import { initCallGraphViewCommands } from './callGraphViewCommands';
import { initDataFlowViewCommands } from './dataFlowViewCommands';
// import { initCallStackViewCommands } from './callStackViewCommands';

export function initCommands(
  context,
  traceDetailsController,
  callGraphViewController,
  dataFlowViewController
) {
  initUserCommands(context);
  initApplicationsViewCommands(context);
  initTraceDetailsViewCommands(context, traceDetailsController);
  initCallGraphViewCommands(context, callGraphViewController);
  initDataFlowViewCommands(context, dataFlowViewController)
  // initCallStackViewCommands(context, callStackViewController);
}