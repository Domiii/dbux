import { initTraceDetailsViewCommands } from './traceDetailsViewCommands';
import { initContextViewCommands } from './contextViewCommands';
import { initCallStackViewCommands } from './callStackViewCommands';
import { initPlaybackCommands } from './playbackCommands';
import { initUserCommands } from './userCommands';

export function initCommands(
  context,
  contextViewController,
  callStackViewController,
  playbackController,
  traceDetailsController
) {
  initUserCommands(context);
  initContextViewCommands(context, contextViewController);
  initCallStackViewCommands(context, callStackViewController);
  initPlaybackCommands(context, playbackController);
  initTraceDetailsViewCommands(context, traceDetailsController);
}