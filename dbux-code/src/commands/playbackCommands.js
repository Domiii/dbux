import { window } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import PlaybackController from '../playback/PlaybackController';
import { registerCommand } from './commandUtil';

const { log, debug, warn, error: logError } = newLogger('PlaybackCommands');

/**
 * @param {vscode.ExtensionContext} context 
 * @param {PlaybackController} playbackController 
 */
export function initPlaybackCommands(context, playbackController) {
  registerCommand(context,
    'dbuxPlayback.play',
    () => playbackController.play()
  );

  registerCommand(context,
    'dbuxPlayback.pause',
    () => playbackController.pause()
  );

  registerCommand(context,
    'dbuxPlayback.previousTrace',
    () => playbackController.previousTrace()
  );

  registerCommand(context,
    'dbuxPlayback.nextTrace',
    () => playbackController.nextTrace()
  );

  registerCommand(context,
    'dbuxPlayback.previousTraceInContext',
    () => playbackController.previousTraceInContext()
  );

  registerCommand(context,
    'dbuxPlayback.nextTraceInContext',
    () => playbackController.nextTraceInContext()
  );
}