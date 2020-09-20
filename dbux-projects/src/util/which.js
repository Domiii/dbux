
import fs from 'fs';
import { newLogger } from '@dbux/common/src/log/logger';
import Process from './Process';

/** @typedef {import('../../dbux-projects/src/ProjectsManager').default} ProjectManager */

const logger = newLogger('which');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

const defaultProcessOptions = { 
  failOnStatusCode: false,
  logStdout: true,
  logStderr: true,
  processOptions: {
    cwd: __dirname // don't need a cwd for these global commands
  }
};

/**
 * Get real path of `path` by `fs.realpathSync`.
 * @param {string} path 
 * @return {string} The real path of `path` or empty string if any error occurred.
 */
function getRealPath(path) {
  try {
    let realPath = fs.realpathSync(path);
    return realPath;
  } catch (err) {
    debug(`getRealPath, path = ${path} errors with message: ${err.message}`);
    return '';
  }
}

/**
 * Returns the full path of anything on the $PATH system variable.
 * For that we use
 *  1. which on nix (Linux, BSD, MAC etc.)
 *  2. where.exe on Windows
 * @param {string} command the command being queried
 * @return {Promise<[string]>} the actual path where `command` is
 */
export default async function which(command) {
  const whichCommand = await lookupWhich();
  if (!which) {
    throw new Error(`Couldn't find which or where.exe in current system.`);
  }

  const cmd = `${whichCommand} ${command}`;
  let result = await Process.execCaptureAll(cmd, defaultProcessOptions);
  if (result.code) {
    throw new Error(`Couldn't find ${command} in $PATH. Got code ${result.code} when executing "${cmd}"`);
  }

  let paths = result.out.split('\n');
  let realPaths = [];

  for (let path of paths) {
    let realPath = getRealPath(path);
    if (realPath) {
      realPaths.push(realPath);
    }
  }

  if (realPaths.length === 0) {
    throw new Error(`${command} found in ${paths}, but failed when checking by \`fs.realpathSync\`.`);
  }

  return realPaths;
}

let whichWhich;
/**
 * For more information on where.exe: https://superuser.com/questions/49104/how-do-i-find-the-location-of-an-executable-in-windows
 * @return {Promise<string>} specify `which` or `where` is used, or empty string if none of them is found.
 */
export async function lookupWhich() {
  if (whichWhich) {
    return whichWhich;
  }

  whichWhich = '';

  let whereResult = await Process.execCaptureAll(`where.exe where.exe`, defaultProcessOptions);
  if (!whereResult.code) {
    let path = getRealPath(whereResult.out);
    if (path) {
      whichWhich = path;
    }
  }

  let whichResult = await Process.execCaptureAll(`which which`, defaultProcessOptions);
  if (!whichResult.code) {
    let path = getRealPath(whichResult.out);
    if (path) {
      whichWhich = path;
    }
  }

  debug('whichWhich:', whichWhich);

  return whichWhich;
}

export async function hasWhich() {
  return !!await lookupWhich();
}