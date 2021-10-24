import {
  window,
  ProgressLocation,
} from 'vscode';
import defaultsDeep from 'lodash/defaultsDeep';
import { newLogger } from '@dbux/common/src/log/logger';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('ProgressBarTask');

/**
 *  see `window.withProgress`: https://code.visualstudio.com/api/references/vscode-api
 * @callback reportCallBack
 * @param {{message?: string, increment?: number}} report
 */

/**
 *  see `window.withProgress`: https://code.visualstudio.com/api/references/vscode-api
 * @callback taskWithProgressBarCallback
 * @param {{report: reportCallBack}} progress
 * @param cancellationToken
 */

/**
 * @param {taskWithProgressBarCallback} cb
 */
export async function runTaskWithProgressBar(cb, options) {
  options = defaultsDeep(options, {
    cancellable: false,
    location: ProgressLocation.Notification,
    title: ''
  });
  options.title = `[Dbux] ${options.title}`;

  return await window.withProgress(options, cb);
}