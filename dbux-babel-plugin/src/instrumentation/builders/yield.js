import * as t from "@babel/types";
import { getInstrumentTargetAstNode } from './common';
import { buildTraceCall } from './templateUtil';
import { buildTraceId, buildTraceIdValue } from './traceId';


export const buildWrapYield = buildTraceCall(
  `(%%wrapYield%%(
  %%argumentVar%% = %%argument%%,
  %%preYield%%(%%yieldStaticContextId%%, %%schedulerTid%%, %%argumentVar%%)
))`,
  function buildWrapYield(state, traceCfg) {
    const { ids: { aliases: { preYield, wrapYield } } } = state;
    const {
      data: {
        argumentVar,
        yieldStaticContextId
      }
    } = traceCfg;
    const argument = getInstrumentTargetAstNode(state, traceCfg);
    const schedulerTid = buildTraceId(state, traceCfg);
    // TODO: add argumentVar
    // const { } = ;

    return {
      preYield,
      wrapYield,
      argument,
      argumentVar,
      yieldStaticContextId: t.numericLiteral(yieldStaticContextId),
      schedulerTid,
    };
  }
);

export const buildPostYield = buildTraceCall(
  // future-work: I forgot why `tid` was not part of the `postYield` call?
  `(
  %%resultVar%% = %%yieldNode%%,
  %%postYield%%(%%resultVar%%, %%argumentVar%%),
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
        
      }
    } = traceCfg;
    const yieldNode = getInstrumentTargetAstNode(state, traceCfg);
    const tid = buildTraceIdValue(state, traceCfg, resultVar);

    return {
      resultVar,
      yieldNode,
      argumentVar,
      postYield,
      tid
    };
  }
);