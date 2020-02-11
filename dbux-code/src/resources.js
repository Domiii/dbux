import path from 'path';
import {ExtensionContext} from 'vscode';

let context: ExtensionContext;

export function getResourcePath(...relativePathSegments) {
  return context.asAbsolutePath(path.join('resources', ...relativePathSegments));
}

export function getThemeResourcePath(...relativePathSegments) {
  return {
    light: getResourcePath('light', ...relativePathSegments),
    dark: getResourcePath('dark', ...relativePathSegments)
  };
}

export function initResources(_context : ExtensionContext) {
  context = _context;
}