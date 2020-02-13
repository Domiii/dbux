import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { initContextViewCommands } from './contextViewCommands';
import { initPlaybackCommands } from './playbackCommands';

import {
  window,
  commands,
  Uri,
  Position,
  Selection
} from 'vscode';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initCommands(context, contextViewController, playbackController) {
  initContextViewCommands(context, contextViewController);
  initPlaybackCommands(context, playbackController);
}