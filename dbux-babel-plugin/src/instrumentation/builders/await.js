import { getInstrumentTargetAstNode } from './common';
import { buildTraceCall } from './templateUtil';
import { buildTraceId } from './traceId';


export const buildWrapAwait = buildTraceCall(
  '(%%wrapAwait%%(%%argument%%, %%awaitContextId%% = %%preAwait%%(%%contextId%%, %%preTraceId%%)))',
  function buildWrapAwait(state, traceCfg) {
    const { ids: { aliases: { preAwait, wrapAwait } } } = state;
    const argument = getInstrumentTargetAstNode(state, traceCfg);
    const preTraceId = buildTraceId(state, traceCfg);
    // const { } = ;

    return {
      preAwait,
      wrapAwait,
      argument,
      awaitContextId,
      contextId,
      preTraceId,
    };
  }
);