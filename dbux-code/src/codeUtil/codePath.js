import { pathJoin, pathNormalizedForce } from '@dbux/common-node/src/util/pathUtil';
import {
  ExtensionContext,
  Uri
} from 'vscode';

/**
 * @type {ExtensionContext}
 */
let context;

export function getResourcePath(...relativePathSegments) {
  return asAbsolutePath(pathJoin('resources', ...relativePathSegments));
}

export function getLogsDirectory() {
  return asAbsolutePath('logs');
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

export function initCodePath(_context) {
  context = _context;
}