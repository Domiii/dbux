import {
  window,
  ProgressLocation,
} from 'vscode';
import defaultsDeep from 'lodash/defaultsDeep';
import { newLogger } from '@dbux/common/src/log/logger';
import sleep from '@dbux/common/src/util/sleep';


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
 * @param {{title: string}} options
 */
export async function runTaskWithProgressBar(cb, options) {
  options = defaultsDeep(options, {
    cancellable: false,
    location: ProgressLocation.Notification,
    title: ''
  });
  options.title = `[Dbux] ${options.title}`;

  return await window.withProgress(options, async (...args) => {
    // NOTE: we need this sleep in case `cb` starts off with a long-running synchronous operation:
    //     progress bar does not start rendering if we don't give control back to it first.
    await sleep();

    return await cb?.(...args);
  });
}