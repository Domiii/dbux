import { pathNormalized } from '@dbux/common-node/src/util/pathUtil';
import path from 'path';
import {
  ExtensionContext,
  Uri
} from 'vscode';

/**
 * @type {ExtensionContext}
 */
let context;

export function getResourcePath(...relativePathSegments) {
  return asAbsolutePath(path.posix.join('resources', ...relativePathSegments));
}

export function getLogsDirectory() {
  return asAbsolutePath('logs');
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
  return pathNormalized(context.asAbsolutePath(fpath));
}

export function getExtensionPath() {
  return pathNormalized(context.extensionPath);
}

export function initCodePath(_context) {
  context = _context;
}