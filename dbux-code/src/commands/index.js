import { initTraceDetailsViewCommands } from './traceDetailsViewCommands';
import { initUserCommands } from './userCommands';
import { initApplicationsViewCommands } from './applicationsViewCommands';
import { initCallGraphViewCommands } from './callGraphViewCommands';
// import { initCallStackViewCommands } from './callStackViewCommands';

export function initCommands(
  context,
  traceDetailsController,
  callGraphViewController
) {
  initUserCommands(context);
  initApplicationsViewCommands(context);
  initTraceDetailsViewCommands(context, traceDetailsController);
  initCallGraphViewCommands(context, callGraphViewController);
  // initCallStackViewCommands(context, callStackViewController);
}