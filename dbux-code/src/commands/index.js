import { initTraceDetailsViewCommands } from './traceDetailsViewCommands';
import { initCallGraphViewCommands } from './callGraphViewCommands';
import { initCallStackViewCommands } from './callStackViewCommands';
import { initUserCommands } from './userCommands';
import { initApplicationsViewCommands } from './applicationsViewCommands';
import { initProjectCommands } from './projectCommands';

export function initCommands(
  context,
  callGraphViewController,
  callStackViewController,
  traceDetailsController,
  projectViewController
) {
  initUserCommands(context, projectViewController);
  initApplicationsViewCommands(context);
  initCallGraphViewCommands(context, callGraphViewController);
  initCallStackViewCommands(context, callStackViewController);
  initTraceDetailsViewCommands(context, traceDetailsController);
  initProjectCommands(context, projectViewController);
}