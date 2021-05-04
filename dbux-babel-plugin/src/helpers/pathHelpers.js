import truncate from 'lodash/truncate';

export function pathToStringSimple(path) {
  return truncate(path.toString().replace(/\n/g, ' '), { length: 100 });
}