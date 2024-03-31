import path from 'path';
import { isWindows } from '@dbux/common-node/src/util/osUtil';
import { pathJoin, pathNormalizedForce, pathResolve } from '@dbux/common-node/src/util/pathUtil';

import {
  ExtensionContext,
  Uri,
  workspace
} from 'vscode';

export const AppDataFileNameSuffix = '.dbuxapp';

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


export function getApplicationDataPath(basePath, zip = true) {
  let exportPath = pathJoin(
    getDefaultExportDirectory(),
    `${basePath}${AppDataFileNameSuffix}`
  );
  if (zip) {
    exportPath += '.zip';
  }
  return exportPath;
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

export function getSystemPath(what) {
  const systemPathName = isWindows() ? 'dbux.paths.windows' : 'dbux.paths.posix';
  return workspace.getConfiguration('').get(`${systemPathName}.${what}`);
}

export function getShellPath() {
  const p = getSystemPath('shell');
  return p || 'bash';
}

export function getShellName() {
  const p = getShellPath();
  // https://stackoverflow.com/questions/4250364/how-to-trim-a-file-extension-from-a-string-in-javascript
  return path.parse(p).name;
}

function getShellConfig(what, shell = null, dontCheck = false) {
  if (!shell) {
    // look-up shell
    shell = getShellName();
  }
  const target = `dbux.shells.${shell}.${what}`;
  const val = workspace.getConfiguration('').get(target);
  if (!dontCheck && !val) {
    throw new Error(`Could not read config value "${target}" - It must not be empty or undefined!`);
  }
  return val;
}

export function getShellInlineFlags() {
  return getShellConfig('inlineFlags');
}

export function getShellPauseCommand() {
  return getShellConfig('pause');
}

export function getShellSep() {
  return getShellConfig('sep');
}

function fixExecutablePath(p) {
  if (p.includes(' ')) {
    return `"${p}"`;
  }
  else {
    return p;
  }
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
  get shell() {
    return getShellPath();
  },
  /**
   * Put shell executable paths in quotation marks, plus -
   * 
   * hackfix: work-around volta bug for yarn and npm.
   * @see https://github.com/volta-cli/volta/issues/1199
   */
  inShell: {
    get yarn() {
      const { yarn } = execPaths;
      return fixExecutablePath(yarn);
    },
    get npm() {
      const { npm } = execPaths;
      return fixExecutablePath(npm);
    }
  }
};

