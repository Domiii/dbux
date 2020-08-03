import process from 'process';

export function isDebug() {
  return process.env.NODE_ENV !== 'production';
}