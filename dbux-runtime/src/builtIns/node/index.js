import patchNodeEvents from './node-events';
import patchNodeUtil from './node-util';

export function tryPatchNode() {
  patchNodeUtil();
  patchNodeEvents();
}
