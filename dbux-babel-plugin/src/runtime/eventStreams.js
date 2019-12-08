import { buildDbuxCall } from '.';

export function buildEventStreamCall(code) {
  return buildDbuxCall(`es.${code}`);
}