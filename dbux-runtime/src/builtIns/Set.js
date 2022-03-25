import { monkeyPatchHolderOverrideDefault } from '../util/monkeyPatchUtil';


export default function patchSet() {
  [
    'has',
    'add',
    'delete',
    'forEach'
  ].forEach(m => monkeyPatchHolderOverrideDefault(Set, m));
}

