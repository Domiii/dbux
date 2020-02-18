import { initContextViewCommands } from './contextViewCommands';
import { initCallStackViewCommands } from './callStackViewCommands';
import { initPlaybackCommands } from './playbackCommands';

export function initCommands(
  context,
  contextViewController,
  callStackViewController,
  playbackController
) {
  initContextViewCommands(context, contextViewController);
  initCallStackViewCommands(context, callStackViewController);
  initPlaybackCommands(context, playbackController);
}