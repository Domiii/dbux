import { monkeyPatchHolderOverrideDefault } from '../util/monkeyPatchUtil';


export default function patchMap() {
  [
    'has',
    'get',
    'set',
    'delete',
    'forEach'
  ].forEach(m => monkeyPatchHolderOverrideDefault(Map, m));

  [
    'has',
    'get',
    'set',
    'delete',
    'forEach'
  ].forEach(m => monkeyPatchHolderOverrideDefault(WeakMap, m));
}

