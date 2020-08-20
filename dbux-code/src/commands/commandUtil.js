import {
  commands
} from 'vscode';
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Command');

// command regist helper
export function registerCommand(context, commandName, func) {
  function _errWrap(f) {
    return async (...args) => {
      try {
        return await f(...args);
      }
      catch (err) {
        logError(`'${commandName}' failed:`, err);
        // throw err;
      }
    };
  }

  const newCommand = commands.registerCommand(commandName, _errWrap(func));
  
  // clear on deactivate
  context.subscriptions.push(newCommand);

  return newCommand;
}