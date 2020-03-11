import initUtilCommands from './utilCommand';
import initTraceDetailsViewCommands from './traceDetailsViewCommands';
import initContextViewCommands from './contextViewCommands';
import initCallStackViewCommands from './callStackViewCommands';
import initPlaybackCommands from './playbackCommands';

export function initCommands(
  context,
  contextViewController,
  callStackViewController,
  playbackController
) {
  initUtilCommands(context);
  initTraceDetailsViewCommands()
  initContextViewCommands(context, contextViewController);
  initCallStackViewCommands(context, callStackViewController);
  initPlaybackCommands(context, playbackController);
}