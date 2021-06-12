import { buildTraceCall } from '../../helpers/templateUtil';
import { makeInputs } from './buildHelpers';
import { buildTraceId } from './misc';


export const buildObjectExpression = buildTraceCall(
  '%%traceObjectExpression%%(%%entries%%, %%tid%%, %%propTids%%)',
  function buildObjectExpression(state, traceCfg) {
    const { ids: { aliases: { traceObjectExpression } } } = state;
    const tid = buildTraceId(state, traceCfg);

    const {
      path
    } = traceCfg;

    const argPaths = path.get('properties');

    return {
      traceObjectExpression,
      entries: buildSpreadableArgArrayNoSpread(argPaths),
      tid,
      propTids: makeInputs(traceCfg)
    };
  }
);