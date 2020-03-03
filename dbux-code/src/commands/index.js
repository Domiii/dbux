import initContextViewCommands from './contextViewCommands';
import initCallStackViewCommands from './callStackViewCommands';
import initPlaybackCommands from './playbackCommands';
import initUtilCommands from './utilCommand';

export function initCommands(
  context,
  contextViewController,
  callStackViewController,
  playbackController
) {
  initUtilCommands(context);
  initContextViewCommands(context, contextViewController);
  initCallStackViewCommands(context, callStackViewController);
  initPlaybackCommands(context, playbackController);
}