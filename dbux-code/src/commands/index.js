import initUtilCommands from './utilCommand';
import initTraceDetailsViewCommands from './traceDetailsViewCommands';
import initContextViewCommands from './contextViewCommands';
import initCallStackViewCommands from './callStackViewCommands';
import initPlaybackCommands from './playbackCommands';

export function initCommands(
  context,
  contextViewController,
  callStackViewController,
  playbackController,
  traceDetailsController
) {
  initUtilCommands(context);
  initContextViewCommands(context, contextViewController);
  initCallStackViewCommands(context, callStackViewController);
  initPlaybackCommands(context, playbackController);
  initTraceDetailsViewCommands(context, traceDetailsController);
}