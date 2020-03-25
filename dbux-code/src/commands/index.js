import { initTraceDetailsViewCommands } from './traceDetailsViewCommands';
import { initCallGraphViewCommands } from './callGraphViewCommands';
import { initCallStackViewCommands } from './callStackViewCommands';
import { initPlaybackCommands } from './playbackCommands';
import { initUserCommands } from './userCommands';

export function initCommands(
  context,
  callGraphViewController,
  callStackViewController,
  playbackController,
  traceDetailsController
) {
  initUserCommands(context);
  initCallGraphViewCommands(context, callGraphViewController);
  initCallStackViewCommands(context, callStackViewController);
  initPlaybackCommands(context, playbackController);
  initTraceDetailsViewCommands(context, traceDetailsController);
}