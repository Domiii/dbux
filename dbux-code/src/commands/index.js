import { initTraceDetailsViewCommands } from './traceDetailsViewCommands';
import { initUserCommands } from './userCommands';
import { initApplicationsViewCommands } from './applicationsViewCommands';
// import { initCallGraphViewCommands } from './callGraphViewCommands';
import { initDataFlowViewCommands } from './dataFlowViewCommands';
import { initDiagnosticCommands } from './diagnosticCommands';
// import { initCallStackViewCommands } from './callStackViewCommands';

export function initCommands(
  context,
  traceDetailsController,
  // callGraphViewController,
  dataFlowViewController
) {
  initUserCommands(context);
  initApplicationsViewCommands(context);
  initTraceDetailsViewCommands(context, traceDetailsController);
  // initCallGraphViewCommands(context, callGraphViewController);
  initDataFlowViewCommands(context, dataFlowViewController);
  // initCallStackViewCommands(context, callStackViewController);
  initDiagnosticCommands(context);
}