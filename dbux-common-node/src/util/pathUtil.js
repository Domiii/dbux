import sh from 'shelljs';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import _commonAncestorPath from 'common-ancestor-path';

/**
 * Get command executable path
 * @param {string} command the command being queried
 * @return {string} the actual path where `command` is
 */
export function whichNormalized(command) {
  const fpath = sh.which(command);
  return fpath ? pathNormalized(fpath.toString()) : null;
}

export function realPathSyncNormalized(fpath, options) {
  return pathNormalized(fs.realpathSync(fpath, options));
}

export function pathResolve(...paths) {
  return pathNormalized(path.resolve(...paths));
}

/**
 * @param  {...string} paths 
 * @returns {string}
 */
export function pathJoin(...paths) {
  return pathNormalized(path.join(...paths));
}

/**
 * @param {*} from Usually the shorter (potential parent/folder) path.
 * @param {*} to The (usually) more concrete file path.
 */
export function pathRelative(from, to) {
  from = pathNormalized(from);
  to = pathNormalized(to);
  const sep = '/';
  if (!from.endsWith(sep)) { from += '/'; }
  if (!to.endsWith(sep)) { to += '/'; }
  return pathNormalized(path.relative(from, to));
}


/**
 * It appears, VSCode is now not normalizing or normalizing to lower-case drive letter (e.g. in Uri.fspath!!!):
 * @see https://code.visualstudio.com/api/references/vscode-api#Uri 
 * @see https://github.com/microsoft/vscode/issues/45760#issuecomment-373417966
 * @see https://github.com/microsoft/vscode/blob/94c9ea46838a9a619aeafb7e8afd1170c967bb55/test/unit/coverage.js#L81
 * 
 * Before that (in 2016), they decided for upper-case drive letters:
 * @see https://github.com/microsoft/vscode/issues/9448
 * @see https://github.com/microsoft/vscode/commit/a6c845baf7fed4a186e3b744c5c14c0be53494fe
 */
export function normalizeDriveLetter(fpath) {
  if (fpath && fpath[1] === ':') {
    fpath = fpath[0].toUpperCase() + fpath.substr(1);
  }
  return fpath;
}

export function pathNormalized(fpath) {
  return fpath.replace(/\\/g, '/');
}

/**
 * In addition to standard normalization, also enforces upper-case drive letter.
 */
export function pathNormalizedForce(fpath) {
  return normalizeDriveLetter(pathNormalized(fpath));
}

export function getPathRelativeToCommonAncestor(fpath, ...otherPaths) {
  const common = getCommonAncestorPath(fpath, ...otherPaths);
  return pathNormalizedForce(
    common &&
    pathRelative(common, fpath) ||
    fpath
  );
}

/**
 * @see https://github.com/isaacs/common-ancestor-path#readme
 */
export function getCommonAncestorPath(...paths) {
  // NOTE: the library requires OS-specific separators
  if (paths.length === 0) {
    return '';
  }
  paths = paths.map(p => path.resolve(p));
  const result = _commonAncestorPath(...paths);
  return pathNormalized(result);
}

export function isFileInPath(parent, file) {
  const relative = pathRelative(parent, file);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export function renderPath(fpath) {
  const home = homedir();
  if (fpath.startsWith(home)) {
    fpath = '~' + fpath.substring(home.length);
  }
  return fpath;
}
