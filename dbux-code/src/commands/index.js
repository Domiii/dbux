import { newLogger } from 'dbux-common/src/log/logger';
import { registerCommand } from './commandUtil';
import { initTreeViewCommands } from './treeViewCommands';

import {
  window,
  commands,
  Uri,
  Position,
  Selection
} from 'vscode';

const { log, debug, warn, error: logError } = newLogger('Commands');

export function initCommands(context) {
  initTreeViewCommands(context);
}