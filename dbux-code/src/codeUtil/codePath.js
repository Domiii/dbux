import { pathJoin, pathNormalizedForce, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import {
  ExtensionContext,
  Uri,
  workspace
} from 'vscode';

/** @typedef { { exportDirectoryOverride: string, nodePath: string } } CodePathConfig  */

/**
 * @type {ExtensionContext}
 */
let context;

/**
 * @type {CodePathConfig}
 */
let cfg;

/**
 * @param {CodePathConfig} _cfg
 */
export function initCodePath(_context) {
  context = _context;
}

export function setCodePathConfig(_cfg) {
  cfg = _cfg;
}

export function getResourcePath(...relativePathSegments) {
  return asAbsolutePath(pathJoin('resources', ...relativePathSegments));
}

export function getUserDataDirectory() {
  return asAbsolutePath('userdata');
}

export function getLogsDirectory() {
  return pathResolve(getUserDataDirectory(), 'logs');
}


export function getDefaultExportDirectory() {
  const dir = pathResolve(getUserDataDirectory(), 'exports');
  return cfg.exportDirectoryOverride || dir;
}

/**
 * @returns normalized, absolute path to the dbux-code extension directory.
 */
export function getCodeDirectory() {
  return asAbsolutePath('.');
}

export function getThemeResourcePath(...relativePathSegments) {
  return {
    light: getResourcePath('light', ...relativePathSegments),
    dark: getResourcePath('dark', ...relativePathSegments)
  };
}

export function getThemeResourcePathUri(...relativePathSegments) {
  return {
    light: Uri.file(getResourcePath('light', ...relativePathSegments)),
    dark: Uri.file(getResourcePath('dark', ...relativePathSegments))
  };
}

export function asAbsolutePath(fpath) {
  return pathNormalizedForce(context.asAbsolutePath(fpath));
}

export function getExtensionPath() {
  return pathNormalizedForce(context.extensionPath);
}

export function getGitPath() {
  const p = workspace.getConfiguration('').get('dbux.paths.git');
  return p || 'git';
}

/**
 * 
 */
export function getNodePath() {
  // const hasVolta = !!whichNormalized('volta');
  // if (hasVolta) {
  //   // get the actual Node binary location that is not inside the target directory (i.e. the globally installed version)
  //   const nodePath = await Process.execCaptureOut(`volta which node`, { processOptions: { cwd: __dirname } });
  //   return pathNormalized(nodePath);
  // }
  const p = workspace.getConfiguration('').get('dbux.paths.node');
  return p || 'node';
}

/**
 * 
 */
export function getNpmPath() {
  const p = workspace.getConfiguration('').get('dbux.paths.npm');
  return p || 'npm';
}

/**
 * 
 */
export function getYarnPath() {
  const p = workspace.getConfiguration('').get('dbux.paths.yarn');
  return p || 'yarn';
}

export function getBashPath() {
  const p = workspace.getConfiguration('').get('dbux.paths.bash');
  return p || 'bash';
}

export const execPaths = {
  get git() {
    return getGitPath();
  },
  get node() {
    return getNodePath();
  },
  get npm() {
    return getNpmPath();
  },
  get yarn() {
    return getYarnPath();
  },
  get bash() {
    return getBashPath();
  }
};
