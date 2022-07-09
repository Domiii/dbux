import * as t from '@babel/types';
import { buildTraceCall } from './templateUtil';
import { makeInputs } from './buildUtil';
import { buildTraceId, forceTraceId } from './traceId';

// ###########################################################################
// arrays
// ###########################################################################

export function buildArrayOfVariables(names) {
  return t.arrayExpression(names.map(name => t.identifier(name)));
}

export function buildGetI(argsVar, i) {
  return t.memberExpression(argsVar, t.numericLiteral(i), true, false);
}

/**
 * Take a bunch of arguments and make sure, none of them is spread.
 * NOTE: This is usually used in tandem with `makeSpreadableArgumentArrayCfg`.
 */
export function buildSpreadableArgArrayNoSpread(argPaths) {
  return t.arrayExpression(argPaths
    .map(argPath => argPath.isSpreadElement() ?
      // t.callExpression(
      //   arrayFrom,
      //   [argNode.argument]
      // ) :
      argPath.node.argument :
      argPath.node
    )
  );
}

export const buildArrayExpression = buildTraceCall(
  '%%traceArrayExpression%%(%%args%%, %%tid%%, %%argTids%%)',
  function buildArrayExpression(state, traceCfg) {
    const { ids: { aliases: { traceArrayExpression } } } = state;
    const tid = buildTraceId(state, traceCfg);
    forceTraceId(tid); // NOTE: `ArrayExpression` needs a trace for value reconstruction

    const {
      path
    } = traceCfg;

    const argPaths = path.get('elements');

    return {
      traceArrayExpression,
      args: buildSpreadableArgArrayNoSpread(argPaths),
      tid,
      argTids: makeInputs(traceCfg)
    };
  }
);
