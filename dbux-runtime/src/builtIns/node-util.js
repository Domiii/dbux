import util from 'util';
import { monkeyPatchFunctionHolder, monkeyPatchMethod } from '../util/monkeyPatchUtil';
// import { peekBCEMatchCallee } from '../data/dataUtil';

// node -e "console.log(require('util'))"
export default function patchNodeUtil() {
  // ###########################################################################
  // inherits
  // ###########################################################################

  /**
   * NOTE: We only implement this,
   * so automatic builtin patcher won't patch this (since it modifies function arguments).
   * 
   * @see https://nodejs.org/docs/latest/api/util.html#util_util_inherits_constructor_superconstructor
   * @deprecated
   */
  monkeyPatchFunctionHolder(util, 'inherits',
    (thisArg, args, originalFunction, patchedFunction) => {
      // const bceTrace = peekBCEMatchCallee(patchedFunction);
      return originalFunction(...args);
    }
  );
}
