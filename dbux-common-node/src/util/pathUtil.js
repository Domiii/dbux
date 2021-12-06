import sh from 'shelljs';
import fs from 'fs';
import path from 'path';
import commonAncestorPath from 'common-ancestor-path';
import EmptyObject from '@dbux/common/src/util/EmptyObject';

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

export function parseNodeModuleName(fpath) {
  fpath = pathNormalized(fpath);
  const matchResult = fpath.match(/(?<=node_modules[/])(?!node_modules)(?<packageName>[^/]+)(?=[/](?!node_modules)(?<name2>[^/]+).*?)/);
  let { packageName, name2 } = matchResult?.groups || EmptyObject;
  if (!packageName) {
    return null;
  }
  if (packageName.startsWith('@') && name2) {
    // only a prefix
    packageName += '/' + name2;
    // console.warn('module match:', packageName, name2);
  }
  return packageName || null;
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
  return commonAncestorPath(...paths);
}

export function isFileInPath(parent, file) {
  const relative = pathRelative(parent, file);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}
