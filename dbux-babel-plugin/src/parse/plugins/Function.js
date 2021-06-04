import template from '@babel/template';
import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildWrapTryFinally, buildSource, buildBlock } from '../../instrumentation/builders/common';
import { injectContextEndTrace } from '../../instrumentation/context';
import { getNodeNames } from '../../visitors/nameVisitors';

import { doesNodeEndScope } from '../../helpers/astUtil';
import ParsePlugin from '../../parseLib/ParsePlugin';
import { buildTraceExpressionSimple, buildTraceId } from '../../instrumentation/builders/misc';


function addContextTrace(bodyPath, state, type) {
  const { scope } = bodyPath;
  const inProgramStaticTraceId = state.traces.addTrace(
    bodyPath,
    {
      type
    }
  );
  const tidIdentifier = scope.generateUidIdentifier(`t${inProgramStaticTraceId}_`);
  return {
    inProgramStaticTraceId,
    tidIdentifier
  };
}

// ###########################################################################
// builders + templates
// ###########################################################################

// TODO: `isInterruptable` should be in `staticContext`, not dynamically recorded
const pushImmediateTemplate = template(
  'var %%contextIdIdentifier%% = %%pushImmediate%%(%%staticContextId%%, %%inProgramStaticTraceId%%, %%isInterruptable%%);'
);

const popFunctionTemplate = template(
  '%%popFunction%%(%%contextIdIdentifier%%, %%tid%%);'
);

const pushResumeTemplate = template(
  /*var %%resumeContextId%% =*/
  `%%dbux%%.pushResume(%%resumeStaticContextId%%, %%traceId%%);`);

const popResumeTemplate = template(
  // `%%dbux%%.popResume(%%resumeContextId%%);`
  `%%dbux%%.popResume();`
);


// ###########################################################################
// helpers
// ###########################################################################

function addResumeContext(bodyPath, state/* , staticId */) {
  const { loc: bodyLoc } = bodyPath.node;

  // the "resume context" starts with the function (function is in "Resumed" state initially)
  const locStart = bodyLoc.start;
  return state.contexts.addResumeContext(bodyPath, locStart);
}

function getLastNodeOfBody(bodyNode) {
  const nodes = Array.isArray(bodyNode) ? bodyNode : bodyNode.body;
  return nodes[nodes.length - 1];
}


export default class Function extends ParsePlugin {
  // ###########################################################################
  // enter
  // ###########################################################################

  enter() {
    // TODO: move `push` and `pop`s to their corresponding correct phases
    const { path, state } = this.node;

    const isGenerator = path.node.generator;
    const isAsync = path.node.async;
    const isInterruptable = isGenerator || isAsync;
    const bodyPath = path.get('body');

    const names = getNodeNames(path.node);
    const {
      name,
      displayName
    } = names;

    const staticContextData = {
      type: 2, // {StaticContextType}
      name,
      displayName,
      isInterruptable
    };

    // TODO: use `const pushTrace = this.Traces.addTrace` instead
    const staticContextId = state.contexts.addStaticContext(path, staticContextData);
    // const pushTraceCfg = addContextTrace(bodyPath, state, TraceType.PushImmediate);
    const staticPushTid = state.traces.addTrace(
      bodyPath,
      {
        type: TraceType.PushImmediate
      }
    );

    // contextIdIdentifier
    const {
      contexts: { genContextId }
    } = state;
    const contextIdIdentifier = genContextId(bodyPath);


    // staticResumeContextId
    let staticResumeContextId;
    if (isInterruptable) {
      staticResumeContextId = addResumeContext(bodyPath, state, staticContextId);
    }

    this.data = {
      contextIdIdentifier,
      staticContextId,
      staticPushTid,
      // pushTraceCfg,
      // recordParams,
      staticResumeContextId
    };
  }

  exit1() {
    // const { path } = this.node;
    // const paramsPath = path.get('params');
    // // const paramIds = paramsPath.node.map(param =>
    // //   // get all variable declarations in `param`
    // //   // see: https://github.com/babel/babel/tree/master/packages/babel-traverse/src/path/family.js#L215
    // //   // see: https://github.com/babel/babel/tree/master/packages/babel-traverse/src/path/lib/virtual-types.js
    // //   Object.values(param.getBindingIdentifierPaths())
    // // ).flat();

    // for (let i = 0; i < paramsPath.node.length; ++i) {
    //   // TODO: in `dbux-data`, compute inputs[0] = `argTid` from `i`, using
    //   //      (i) `bceStaticTrace.dataNode.argConfigs`,
    //   //      (ii) `{ argTids, spreadLengths } = bceTrace.data`

    //   // TODO: also add declaration in same trace
    //   //  -> paramNode.getDeclarationNode().addOwnDeclarationTrace();

    //   // TODO: need to insert new `traceParam` call; cannot default (replacement-based) instrumentation

    //   // trace -> `traceParam(param, tid, i)`
    //   this.Traces.addTrace({
    //     path: paramsPath.get(i.toString()),
    //     // node,
    //     staticTraceData: {
    //       type: TraceType.Param
    //     },
    //     meta: {
    //       build: buildTraceExpressionSimple,
    //       traceCall: 'traceParam',
    //       moreTraceCallArgs: [t.numericLiteral(i)]
    //     }
    //   });

    //   // TODO: `{Object,Array,Assignment}Pattern
    // }
  }

  exit() {
    const { path } = this.node;

    // NOTE: `finalizeInstrument` will trigger with the final `pop` trace, and then does everything
    // this.data.popTrace = state.traces.addTrace(bodyPath, { type: TraceType.PopImmediate });
    // this.data.popTraceCfg = addContextTrace(bodyPath, state, TraceType.PopImmediate);
    this.data.popTraceCfg = this.node.Traces.addTrace({
      path,
      staticTraceData: {
        type: TraceType.PopImmediate
      },
      meta: {
        instrument: this.instrumentTrace
      }
    });
  }


  // ###########################################################################
  // buildPush
  // ###########################################################################

  buildPush = () => {
    // TODO: capture closure variables, to get their correct `declarationTid`

    const {
      contextIdIdentifier, staticContextId, staticPushTid, staticResumeContextId
    } = this.data;
    const { state } = this.node;
    const {
      ids: {
        aliases: {
          pushImmediate
        }
      }
    } = state;
    return pushImmediateTemplate({
      contextIdIdentifier,
      pushImmediate,
      staticContextId: t.numericLiteral(staticContextId),
      inProgramStaticTraceId: t.numericLiteral(staticPushTid),
      isInterruptable: t.booleanLiteral(!!staticResumeContextId)
    });
  }

  // ###########################################################################
  // buildPop
  // ###########################################################################

  buildPop = () => {
    const {
      contextIdIdentifier, popTraceCfg
    } = this.data;
    const { state } = this.node;
    const {
      ids: {
        aliases: {
          popFunction
        }
      }
    } = state;

    const tid = buildTraceId(state, popTraceCfg);

    return popFunctionTemplate({
      popFunction,
      contextIdIdentifier,
      tid
    });
  }

  // ###########################################################################
  // instrumentTrace
  // ###########################################################################

  /**
   * Instrument all Functions to keep track of all (possibly async) execution stacks.
   * Called as trace.instrument.
   */
  instrumentTrace = (path, state /*, traceCfg */) => {
    const {
      staticResumeContextId
    } = this.data;

    // TODO: warn of eval
    //      -> maybe try instrumenting it if it is a simple string?
    //      -> consider bundling `@dbux/babel-plugin` and `@babel/register` with runtime in case of eval?
    const bodyPath = path.get('body');

    // NOTE: `pushImmediate` also records the `trace` for us.

    let pushes = [
      this.buildPush()
    ];

    let pops = [
      this.buildPop()
    ];

    if (staticResumeContextId) {
      // this is an interruptable function -> push + pop "resume contexts"
      // const resumeContextId = bodyPath.scope.generateUid('resumeContextId');
      throw new Error(`TODO: Fix async functions`);
      // pushes = [
      //   ...pushes,
      //   pushResumeTemplate({
      //     dbux,
      //     // resumeContextId,
      //     resumeStaticContextId: t.numericLiteral(staticResumeContextId),
      //     traceId: t.numericLiteral(staticPushTraceId)
      //   })
      // ];

      // pops = [
      //   popResumeTemplate({
      //     dbux,
      //     // resumeContextId,
      //     // traceId: t.numericLiteral(popTraceId)
      //     // contextId: contextIdVar
      //   }),
      //   ...pops
      // ];
    }

    let bodyNode = bodyPath.node;
    if (!bodyPath.isBlockStatement()) {
      // simple lambda expression -> convert to block lambda expression with return statement
      // NOTE: This enables us to add `try/finally`; also the return statement indicates `ContextEnd`.
      bodyNode = t.blockStatement([t.returnStatement(bodyNode)]);

      // TODO: make sure that the new `ReturnStatement` is properly traced
      // bodyNode.body[0].loc = origBodyNode.loc;
      // bodyNode.body[0].argument.loc = origBodyNode.loc;
    }
    else {
      const lastNode = getLastNodeOfBody(bodyNode);
      if (!lastNode || !doesNodeEndScope(lastNode)) {
        // add ContextEnd trace
        // console.debug(`injecting EndOfContext for: ${bodyPath.toString()}`);
        injectContextEndTrace(path, state);
      }
    }

    // wrap the function in a try/finally statement
    const newBody = buildBlock([
      ...pushes,
      // ...recordParams,
      buildWrapTryFinally(bodyNode, pops)
    ]);

    // bodyPath.context.create(bodyNode, bodyNode, 'xx')
    bodyPath.replaceWith(newBody);
  }
}