import { util } from '@dbux/common/src/util/universalLib';
import { monkeyPatchFunctionHolderDefault } from '../../util/monkeyPatchUtil';
// import { peekBCEMatchCallee } from '../data/dataUtil';

/**
 * NOTE: We only implement this, 
 * so automatic builtin patcher won't patch this (since it modifies function arguments).
 * 
 * @see https://nodejs.org/docs/latest/api/util.html#util_util_inherits_constructor_superconstructor
*/
export default function patchNodeUtil() {
  // ###########################################################################
  // inherits
  // ###########################################################################
  monkeyPatchFunctionHolderDefault(util, 'inherits');
  monkeyPatchFunctionHolderDefault(process, 'cwd');
}
