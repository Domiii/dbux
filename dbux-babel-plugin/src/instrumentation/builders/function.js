/**
 * @file
 * future-work: move remaining `build` functions from `Function.js` to here
 */

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

    const tids = paramTraceCfgs.map(traceCfg => traceCfg.tidIdentifier);

    return {
      registerParams,
      tids
    };
  }
);
