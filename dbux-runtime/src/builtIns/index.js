import patchArray from './arrays';
import patchFunction from './functions';

export default function initPatchBuiltins() {
  patchArray();
  patchFunction();
}
