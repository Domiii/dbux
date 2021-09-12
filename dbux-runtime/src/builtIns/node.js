import patchNodeUtil from './node-util';

export default function tryPatchNode() {
  /**
   * @see https://stackoverflow.com/a/35813135
   */
  if (globalThis.process?.release?.name !== 'node') {
    globalThis.process = { env: {} };
    return;
  }
  patchNodeUtil();
}
