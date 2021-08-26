import * as t from '@babel/types';
import { bindExpressionTemplate } from './templateUtil';


// ###########################################################################
// newTraceId
// ###########################################################################

export function forceTraceId(tid) {
  // add `force = true` to the arg list
  tid.right.arguments.push(t.booleanLiteral(true));
}

export const buildTraceId = bindExpressionTemplate(
  '%%traceId%% = %%newTraceId%%(%%staticTraceId%%)',
  function buildTraceId(state, { tidIdentifier, inProgramStaticTraceId }) {
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

/**
 * `newTraceId(staticTraceId, value)`
 * 
 * NOTE: Combines `newTraceId` with effect of `traceExpression` into one.
 * NOTE2: This is used if return value of expression is not used. Example: `registerParams`
 * NOTE3: this is different from `buildTraceDeclarations` when a `decl` has a `value`, since in that case, declaration and definition are separated.
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