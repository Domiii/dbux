import * as t from "@babel/types";
import { getInstrumentTargetAstNode } from './common';
import { buildTraceCall } from './templateUtil';
import { buildTraceId, buildTraceIdValue } from './traceId';


export const buildWrapYield = buildTraceCall(
  `(%%preYield%%(
  %%argumentVar%% = %%argument%%,
  %%schedulerTid%%
))`,
  function buildWrapYield(state, traceCfg) {
    const { ids: { aliases: { preYield } } } = state;
    const {
      data: {
        argumentVar
      }
    } = traceCfg;
    const argument = getInstrumentTargetAstNode(state, traceCfg);
    const schedulerTid = buildTraceId(state, traceCfg);
    // TODO: add argumentVar
    // const { } = ;

    return {
      preYield,
      argument,
      argumentVar,
      schedulerTid,
    };
  }
);

export const buildPostYield = buildTraceCall(
  `(
  %%resultVar%% = %%yieldNode%%,
  %%postYield%%(%%resultVar%%, %%argumentVar%%, %%realContextIdVar%%, %%staticResumeContextId%%),
  %%tid%%,
  %%resultVar%%
)`,
  function buildPostYield(state, traceCfg) {
    const { ids: { aliases: { 
      postYield
    } } } = state;
    const {
      data: {
        argumentVar,
        resultVar,
        realContextIdVar,
        staticResumeContextId
      }
    } = traceCfg;
    const yieldNode = getInstrumentTargetAstNode(state, traceCfg);
    const tid = buildTraceIdValue(state, traceCfg, resultVar);

    return {
      resultVar,
      yieldNode,
      argumentVar,
      realContextIdVar,
      staticResumeContextId: t.numericLiteral(staticResumeContextId),
      postYield,
      tid
    };
  }
);