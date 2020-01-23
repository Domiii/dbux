import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { initTreeViewCommands } from './treeViewCommands';
import { initPlaybackCommands } from './playbackCommands';

import {
  window,
  commands,
  Uri,
  Position,
  Selection
} from 'vscode';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initCommands(context, treeViewController, playbackController) {
  initTreeViewCommands(context, treeViewController);
  initPlaybackCommands(context, playbackController);
}