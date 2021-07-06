import * as t from "@babel/types";
import { getInstrumentTargetAstNode } from './common';
import { buildTraceCall } from './templateUtil';
import { buildTraceId, buildTraceIdValue } from './traceId';


export const buildWrapAwait = buildTraceCall(
  '(%%wrapAwait%%(%%argument%%, %%awaitContextIdVar%% = %%preAwait%%(%%awaitContextId%%, %%tid%%)))',
  function buildWrapAwait(state, traceCfg) {
    const { ids: { aliases: { preAwait, wrapAwait } } } = state;
    const {
      data: {
        awaitContextId,
        awaitContextIdVar
      }
    } = traceCfg;
    const argument = getInstrumentTargetAstNode(state, traceCfg);
    const tid = buildTraceId(state, traceCfg);
    // const { } = ;

    return {
      preAwait,
      wrapAwait,
      argument,
      awaitContextIdVar,
      awaitContextId: t.numericLiteral(awaitContextId),
      tid,
    };
  }
);

export const buildPostAwait = buildTraceCall(
  `(
  %%resultVar%% = %%awaitNode%%,
  %%postAwait%%(%%awaitContextIdVar%%),
  %%tid%%
)`,
  function buildPostAwait(state, traceCfg) {
    const { ids: { aliases: { 
      postAwait
    } } } = state;
    const {
      data: {
        awaitContextIdVar,
        resultVar
      }
    } = traceCfg;
    const awaitNode = getInstrumentTargetAstNode(state, traceCfg);
    const tid = buildTraceIdValue(state, traceCfg, resultVar);

    return {
      resultVar,
      awaitNode,
      postAwait,
      awaitContextIdVar,
      tid
    };
  }
);