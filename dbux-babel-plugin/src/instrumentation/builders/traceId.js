import * as t from '@babel/types';
import { bindExpressionTemplate } from './templateUtil';


// ###########################################################################
// newTraceId
// ###########################################################################

export function forceTraceId(tid) {
  // add `force = true` to the arg list
  tid.right.arguments.push(t.booleanLiteral(true));
}

export const buildTraceIdNoIdentifier = bindExpressionTemplate(
  '%%newTraceId%%(%%staticTraceId%%)',
  function buildTraceIdNoIdentifier(state, { inProgramStaticTraceId }) {
    const { ids: { aliases: {
      newTraceId
    } } } = state;

    return {
      newTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId)
    };
  },
);

const buildTraceId_ = bindExpressionTemplate(
  '%%traceId%% = %%newTraceId%%(%%staticTraceId%%)',
  function buildTraceId_(state, traceCfg) {
    const { tidIdentifier, inProgramStaticTraceId } = traceCfg;
    const { ids: { aliases: {
      newTraceId
    } } } = state;

    return {
      newTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId),
      traceId: tidIdentifier
    };
  },
);

export function buildTraceId(state, traceCfg) {
  if (!traceCfg.tidIdentifier) {
    return buildTraceIdNoIdentifier(state, traceCfg);
  }
  return buildTraceId_(state, traceCfg);
}

/**
 * `newTraceId(staticTraceId, value)`
 * 
 * NOTE: Combines `newTraceId` with effect of `traceExpression` into one.
 * NOTE2: This is used if return value of expression is not used. Example: `registerParams`
 * NOTE3: this is different from `buildTraceDeclarations` when a `decl` has a `value`, since in that case, declaration and definition are separated.
 * 
 * TODO: fix this, then un-deprecate.
 * 
 * @deprecated WARNING: this does not work!! `newTraceId` does not take a value!
 */
export const buildTraceIdValue = bindExpressionTemplate(
  '%%traceId%% = %%newTraceId%%(%%staticTraceId%%, %%value%%)',
  function buildTraceIdValue(state, { tidIdentifier, inProgramStaticTraceId }, value) {
    const { ids: { aliases: {
      newTraceId
    } } } = state;

    return {
      newTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId),
      traceId: tidIdentifier,
      value
    };
  },
);