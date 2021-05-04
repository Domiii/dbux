import truncate from 'lodash/truncate';

export function pathToStringAnnotated(path) {
  return `[${path.node.type}] "${pathToStringSimple(path)}"`;
}

export function pathToStringSimple(path) {
  return truncate(path.toString().replace(/\n/g, ' '), { length: 100 });
}