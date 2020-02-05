import path from 'path';

export function getResourcePath(...relativePathSegments) {
  return path.resolve(__dirname, '../resources/', ...relativePathSegments);
}

export function getThemeResourcePath(...relativePathSegments) {
  return {
    light: getResourcePath('light', ...relativePathSegments),
    dark: getResourcePath('dark', ...relativePathSegments)
  };
}