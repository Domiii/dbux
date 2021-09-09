import patchNodeUtil from './node-util';

export default function patchNode() {
  /**
   * @see https://stackoverflow.com/a/35813135
   */
  if (globalThis.process?.release?.name !== 'node') {
    return;
  }
  patchNodeUtil();
}
