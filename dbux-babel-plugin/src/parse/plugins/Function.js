import template from '@babel/template';
import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildWrapTryFinally, buildSource, buildBlock } from '../../instrumentation/builders/common';
import { injectContextEndTrace } from '../../instrumentation/context';
import { getNodeNames } from '../../visitors/nameVisitors';

import { getBindingIdentifierPaths } from '../../helpers/bindingsUtil';
import { doesNodeEndScope } from '../../helpers/astUtil';
import ParsePlugin from '../../parseLib/ParsePlugin';
import { buildTraceId, buildTraceWriteVar } from '../../instrumentation/builders/misc';
import { buildRegisterParams } from '../../instrumentation/builders/function';
import { pathToString } from '../../helpers/pathHelpers';


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
// util
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

function getParamInitialValuePath(paramPath) {
  // TODO: support destructuring
  if (paramPath.parentPath.isAssignmentPattern()) {
    // e.g. get `3` from `a` in `function f(a = 3) {}`
    return paramPath.parentPath.get('right');
  }
  return null;
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

    // TODO: use `const pushTrace = Traces.addTrace` instead
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

  _addParamTrace = (paramPath) => {
    // TODO: `RestElement`
    // TODO: `{Object,Array,Assignment}Pattern
    // TODO: `{Object,Array,Assignment}Pattern on `RestElement`

    const idPaths = getBindingIdentifierPaths(paramPath);
    if (idPaths.length !== 1) {
      this.warn(`NYI: param is destructured into less or more than 1 variable ${pathToString(paramPath)}`);
    }
    const idPath = idPaths[0];
    const idNode = this.node.getNodeOfPath(idPath);
    const initialValuePath = getParamInitialValuePath(idPath);
    const moreTraceData = {
      staticTraceData: {
        type: TraceType.Param
      },
      meta: {}
    };

    let definitionPath;
    if (initialValuePath) {
      // handle default parameter
      definitionPath = null;  // NOTE: we will inject the value in post (moreTraceArgs)

      const writeTraceData = {
        path: paramPath,
        // node: idNode,
        staticTraceData: {
          type: TraceType.WriteVar
        },
        meta: {
          build: buildTraceWriteVar,
          replacePath: initialValuePath
        }
      };

      const writeTrace = idNode.Traces.addTrace(writeTraceData);

      moreTraceData.meta.moreTraceArgs = () => {
        // hackfix: instrument as we go
        // 1. remove default value: `x = twv(init(), initTid,...)` becomes `x`
        paramPath.replace(idPath.node);
        // 2. add to instrumentation trace: `var x = td(stid, twv(init(), initTid,...), [initTid])`
        return [
          initialValuePath.node,
          t.arrayExpression([writeTrace.tidIdentifier])
        ];
      };
    }
    else {
      definitionPath = idPath;
    }

    const declTrace = idNode.addOwnDeclarationTrace(definitionPath, moreTraceData);
    return declTrace;
  }

  exit1() {
    const { path } = this.node;
    const paramsPath = path.get('params');

    // -> `registerParams([traceDeclaration(tid0, p0), traceDeclaration(tid1, p1), ...])`
    this.data.paramTraces = paramsPath.map(this._addParamTrace);
  }

  exit() {
    const { path, Traces } = this.node;

    // NOTE: `finalizeInstrument` will trigger with the final `pop` trace, and then does everything
    // this.data.popTrace = state.traces.addTrace(bodyPath, { type: TraceType.PopImmediate });
    // this.data.popTraceCfg = addContextTrace(bodyPath, state, TraceType.PopImmediate);
    this.data.popTraceCfg = Traces.addTrace({
      path,
      staticTraceData: {
        type: TraceType.PopImmediate
      },
      meta: {
        instrument: this.doInstrument
      }
    });
  }


  // ###########################################################################
  // buildPush
  // ###########################################################################

  injectParamsTrace() {
    const { state } = this.node;
    const { paramTraces } = this.data;

    const p = buildRegisterParams(state, paramTraces);
    this.node.path.get('body').unshiftContainer("body", p);
  }

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

    return [
      pushImmediateTemplate({
        contextIdIdentifier,
        pushImmediate,
        staticContextId: t.numericLiteral(staticContextId),
        inProgramStaticTraceId: t.numericLiteral(staticPushTid),
        isInterruptable: t.booleanLiteral(!!staticResumeContextId)
      })
    ];
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

  instrument1() {
    this.injectParamsTrace();
  }

  // ###########################################################################
  // doInstrument
  // ###########################################################################

  /**
   * Instrument all Functions to keep track of all (possibly async) execution stacks.
   * Called as trace.instrument.
   */
  doInstrument = (state /*, traceCfg */) => {
    const {
      node: { path },
      data: {
        returnTraceCfg,
        staticResumeContextId
      }
    } = this;

    // TODO: warn of eval
    //      -> maybe try instrumenting it if it is a simple string?
    //      -> consider bundling `@dbux/babel-plugin` and `@babel/register` with runtime in case of eval?
    const bodyPath = path.get('body');

    // NOTE: `pushImmediate` also records the `trace` for us.

    let pushes = this.buildPush();

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
    if (!returnTraceCfg) {
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