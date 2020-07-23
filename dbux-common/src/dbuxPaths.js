import process from 'process';

export function getDbuxRoot(devPath) {
  return process.env.NODE_ENV === 'production' ? '' : devPath;
}