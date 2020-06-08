import { initTraceDetailsViewCommands } from './traceDetailsViewCommands';
import { initUserCommands } from './userCommands';
import { initApplicationsViewCommands } from './applicationsViewCommands';
import { initProjectCommands } from './projectCommands';
import { initCallGraphViewCommands } from './callGraphViewCommands';
// import { initCallStackViewCommands } from './callStackViewCommands';

export function initCommands(
  context,
  traceDetailsController,
  projectViewController,
  callGraphViewController
) {
  initUserCommands(context, projectViewController);
  initApplicationsViewCommands(context);
  initTraceDetailsViewCommands(context, traceDetailsController);
  initProjectCommands(context, projectViewController);
  initCallGraphViewCommands(context, callGraphViewController);
  // initCallStackViewCommands(context, callStackViewController);
}