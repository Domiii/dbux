/**
 * @file
 * future-work: move remaining `build` functions from `Function.js` to here
 */

import { getDeclarationTid, ZeroNode } from './buildUtil';
import { bindTemplate } from './templateUtil';

// ###########################################################################
// traceParams
// ###########################################################################

/**
 * 
 */
export const buildRegisterParams = bindTemplate(
  '%%registerParams%%(%%tids%%)',
  function buildTraceExpression(state, paramTraceCfgs) {
    const { ids: { aliases: { registerParams } } } = state;

    const tids = paramTraceCfgs.map(traceCfg => traceCfg && getDeclarationTid(traceCfg) || ZeroNode);

    return {
      registerParams,
      tids
    };
  }
);
