import { monkeyPatchMethodOverrideDefault } from '../util/monkeyPatchUtil';


export default function patchSet() {
  [
    'has',
    'add',
    'delete',
    'forEach'
  ].forEach(m => monkeyPatchMethodOverrideDefault(Set, m));
}

