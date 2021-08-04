import sh from 'shelljs';
import fs from 'fs';
import path from 'path';

/**
 * Get command executable path
 * @param {string} command the command being queried
 * @return {string} the actual path where `command` is
 */
export function whichNormalized(command) {
  const fpath = sh.which(command);
  return fpath ?? pathNormalized(fpath.toString());
}

export function realPathSyncNormalized(fpath, options) {
  return pathNormalized(fs.realpathSync(fpath, options));
}

export function pathResolve(...paths) {
  return pathNormalized(path.resolve(...paths));
}

export function pathJoin(...paths) {
  return pathNormalized(path.join(...paths));
}

export function pathNormalized(fpath) {
  return fpath.replace(/\\/g, '/');
}

export function parseNodeModuleName(fpath) {
  const matchResult = fpath.match(/(?<=node_modules[/\\])(?!node_modules)(?<packageName>[^/\\]+)(?=[/\\](?!node_modules).*)/);
  return matchResult?.groups.packageName || null;
}
