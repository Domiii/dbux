import {
  window,
  ProgressLocation,
} from 'vscode';
import defaultsDeep from 'lodash/defaultsDeep';
import { newLogger } from '@dbux/common/src/log/logger';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ProgressBarTask');

function _errWrap(f) {
  return async (...args) => {
    try {
      return await f(...args);
    }
    catch (err) {
      logError('Error when executing function of task', 
        f.name || '(anonymous callback)', '-', err);
      // throw err;
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
export async function runTaskWithProgressBar(cb, options) {
  options = defaultsDeep(options, {
    cancellable: true,
    location: ProgressLocation.Notification,
    title: '[dbux]'
  });
  return window.withProgress(options, _errWrap(cb));
}