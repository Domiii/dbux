
import fs from 'fs';
import { newLogger } from '@dbux/common/src/log/logger';
import Process from './Process';

/** @typedef {import('../../dbux-projects/src/ProjectsManager').default} ProjectManager */

const logger = newLogger('which');

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = logger;

const option = { failOnStatusCode: false };

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

  let result = await Process.execCaptureAll(`${whichCommand} ${command}`, option);
  if (result.code) {
    throw new Error(`Couldn't find ${command} in $PATH.`);
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

  let whereResult = await Process.execCaptureAll(`where.exe where.exe`, option);
  if (!whereResult.code) {
    let path = getRealPath(whereResult.out);
    if (path) {
      return whichWhich = path;
    }
  }

  let whichResult = await Process.execCaptureAll(`which which`, option);
  if (!whichResult.code) {
    let path = getRealPath(whichResult.out);
    if (path) {
      return whichWhich = path;
    }
  }

  return '';
}

export async function hasWhich() {
  return !!await lookupWhich();
}