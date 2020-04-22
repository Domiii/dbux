import { initTraceDetailsViewCommands } from './traceDetailsViewCommands';
import { initCallGraphViewCommands } from './callGraphViewCommands';
import { initCallStackViewCommands } from './callStackViewCommands';
import { initPlaybackCommands } from './playbackCommands';
import { initUserCommands } from './userCommands';
import { initApplicationsViewCommands } from './applicationsViewCommands';
import { initProjectCommands } from './projectCommands';

export function initCommands(
  context,
  callGraphViewController,
  callStackViewController,
  playbackController,
  traceDetailsController,
  projectViewController
) {
  initUserCommands(context, projectViewController);
  initApplicationsViewCommands(context);
  initCallGraphViewCommands(context, callGraphViewController);
  initCallStackViewCommands(context, callStackViewController);
  initPlaybackCommands(context, playbackController);
  initTraceDetailsViewCommands(context, traceDetailsController);
  initProjectCommands(context, projectViewController);
}