import * as t from "@babel/types";
import { getInstrumentTargetAstNode } from './common';
import { buildTraceCall } from './templateUtil';
import { buildTraceId, buildTraceIdValue } from './traceId';


export const buildWrapAwait = buildTraceCall(
  '(%%wrapAwait%%(%%argumentVar%% = %%argument%%, %%awaitContextIdVar%% = %%preAwait%%(%%awaitContextId%%, %%tid%%, %%argumentVar%%)))',
  function buildWrapAwait(state, traceCfg) {
    const { ids: { aliases: { preAwait, wrapAwait } } } = state;
    const {
      data: {
        argumentVar,
        awaitContextId,
        awaitContextIdVar
      }
    } = traceCfg;
    const argument = getInstrumentTargetAstNode(state, traceCfg);
    const tid = buildTraceId(state, traceCfg);
    // TODO: add argumentVar
    // const { } = ;

    return {
      preAwait,
      wrapAwait,
      argument,
      argumentVar,
      awaitContextIdVar,
      awaitContextId: t.numericLiteral(awaitContextId),
      tid,
    };
  }
);

export const buildPostAwait = buildTraceCall(
  `(
  %%resultVar%% = %%awaitNode%%,
  %%postAwait%%(%%resultVar%%, %%argumentVar%%, %%awaitContextIdVar%%),
  %%tid%%
)`,
  function buildPostAwait(state, traceCfg) {
    const { ids: { aliases: { 
      postAwait
    } } } = state;
    const {
      data: {
        argumentVar,
        resultVar,
        awaitContextIdVar
      }
    } = traceCfg;
    const awaitNode = getInstrumentTargetAstNode(state, traceCfg);
    const tid = buildTraceIdValue(state, traceCfg, resultVar);

    return {
      resultVar,
      awaitNode,
      argumentVar,
      postAwait,
      awaitContextIdVar,
      tid
    };
  }
);