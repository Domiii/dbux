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
  return context.asAbsolutePath(path.join('resources', ...relativePathSegments));
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

export function initResources(_context) {
  context = _context;
}