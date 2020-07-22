import path from 'path';
import { ExtensionContext } from 'vscode';

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

export function initResources(_context) {
  context = _context;
}