import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';

import PlaybackController from '../playback/PlaybackController';

import {
  window
} from 'vscode';

const { log, debug, warn, error: logError } = newLogger('PlaybackCommands');

export function initPlaybackCommands(context, playbackController: PlaybackController){

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