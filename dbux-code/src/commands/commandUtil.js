import {
  window,
  commands
} from 'vscode';
import { logError } from 'dbux-common/src/log/logger';

// command regist helper
export function registerCommand(context, commandName, func, pushToClient = false) {
  function _errWrap(f) {
    return (...args) => {
      try {
        return f(...args);
      }
      catch (err) {
        logError(commandName, 'command failed', err);
        throw err;
      }
    };
  }

  const newCommand = commands.registerCommand(commandName, _errWrap(func));
  if (pushToClient) context.subscriptions.push(newCommand);

  return newCommand;
}