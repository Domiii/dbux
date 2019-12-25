import process from 'process';

export function isDebug() {
  return process.NODE_ENV !== 'production';
}