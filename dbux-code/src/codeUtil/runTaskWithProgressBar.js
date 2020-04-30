import {
  window,
  ProgressLocation,
} from 'vscode';
import defaultsDeep from 'lodash/defaultsDeep';
import { newLogger } from 'dbux-common/src/log/logger';


const { log, debug, warn, error: logError } = newLogger('TaskWithProgressBar');

function _errWrap(f) {
  return async (...args) => {
    try {
      return await f(...args);
    }
    catch (err) {
      logError('Error when executing function of task');
      throw err;
    }
  };
}

/**
 *  see `window.withProgress`: https://code.visualstudio.com/api/references/vscode-api
 * @callback taskWithProgressBarCallback
 * @param progress
 * @param cancellationToken
 */

/**
 * @param {taskWithProgressBarCallback} cb
 */
export function runTaskWithProgressBar(cb, options) {
  options = defaultsDeep(options, {
    cancellable: true,
    location: ProgressLocation.Notification,
    title: '[dbux]'
  });
  window.withProgress(options, _errWrap(cb));
}