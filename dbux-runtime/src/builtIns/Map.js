import { monkeyPatchMethodOverrideDefault } from '../util/monkeyPatchUtil';


export default function patchMap() {
  [
    'has',
    'get',
    'set',
    'delete',
    'forEach'
  ].forEach(m => monkeyPatchMethodOverrideDefault(Map, m));

  [
    'has',
    'get',
    'set',
    'delete'
  ].forEach(m => monkeyPatchMethodOverrideDefault(WeakMap, m));
}

