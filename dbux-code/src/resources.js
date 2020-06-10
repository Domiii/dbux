import path from 'path';
import { ExtensionContext } from 'vscode';

/**
 * @type {ExtensionContext}
 */
let context;

// TODO: manage all resources here? (such as `dbux-projects/assets`)

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