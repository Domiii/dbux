import template from '@babel/template';
import * as t from "@babel/types";
import TraceType from '@dbux/common/src/types/constants/TraceType';
import StaticContextType from '@dbux/common/src/types/constants/StaticContextType';
import BasePlugin from './BasePlugin';
import { getNodeNames } from '../../visitors/nameVisitors';
import { doesNodeEndScope } from '../../helpers/astUtil';
import { buildWrapTryFinally, buildBlock, wrapPushPopBlock } from '../../instrumentation/builders/common';
import { buildContextEndTrace } from '../../instrumentation/context';
import { buildRegisterParams } from '../../instrumentation/builders/function';
// import { locToString } from '../../helpers/locHelpers';
import { astNodeToString, pathToStringAnnotated } from '../../helpers/pathHelpers';
import { ZeroNode } from '../../instrumentation/builders/buildUtil';

/** @typedef { import("./StaticContext").default } StaticContext */

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
  'var %%contextIdVar%% = %%pushImmediate%%(%%staticContextId%%, %%inProgramStaticTraceId%%, %%definitionTid%%, %%isInterruptable%%);'
);

// const popFunctionTemplate = template(
//   '%%popFunction%%(%%contextIdVar%%, %%tid%%);'
// );

const pushResumeTemplate = template(
  /*var %%resumeContextId%% =*/
  `var %%contextIdVar%% = %%dbux%%.pushResume(%%realContextId%%, %%resumeStaticContextId%%, %%inProgramStaticTraceId%%, %%definitionTid%%);`);

// const popResumeTemplate = template(
//   // `%%dbux%%.popResume(%%resumeContextId%%);`
//   `%%dbux%%.popResume();`
// );


// ###########################################################################
// util
// ###########################################################################

function addResumeContext(bodyPath, state, staticContextId, contextType) {
  const { loc: bodyLoc } = bodyPath.node;

  // the "resume context" starts with the function (function is in "Resumed" state initially)
  const locStart = bodyLoc.start;
  return state.contexts.addResumeContext(bodyPath, locStart, contextType);
}

function getLastNodeOfBody(bodyNode) {
  if (!bodyNode) {
    return null;
  }
  const nodes = Array.isArray(bodyNode) ? bodyNode : bodyNode.body;
  return nodes[nodes.length - 1];
}


export default class Function extends BasePlugin {
  static plugins = ['Params'];

  createStaticTraceData(namePath = null, traceType = null, dataNode = null) {
    const { data: { staticContextId } } = this;

    const name = namePath?.toString();

    dataNode ||= {};
    dataNode.isNew = true;
    dataNode.label ||= name;

    return {
      type: traceType || TraceType.FunctionDefinition,
      dataNode,
      data: {
        name,
        staticContextId
      }
    };
  }

  setFunctionTraceCfg(traceCfg) {
    this.functionTraceCfg = traceCfg;
    const noDataReason = this.isGenerator ?
      'Generator Function' :
      this.isAsync ?
        'Async Function' :
        null;

    if (noDataReason) {
      this.node.addStaticNoDataPurpose(this.node.path, noDataReason);
    }
  }

  get isInterruptable() {
    return this.node.StaticContext.isInterruptable;
  }

  get isAsync() {
    return this.node.StaticContext.isAsync;
  }

  get isGenerator() {
    return this.node.StaticContext.isGenerator;
  }

  // ###########################################################################
  // enter
  // ###########################################################################

  enter() {
    // TODO: move `pop`s to correct phase
    const {
      isAsync,
      isGenerator,
      node: { path, state }
    } = this;

    const isInterruptable = isAsync || isGenerator;
    const bodyPath = path.get('body');

    const names = getNodeNames(path.node);
    const {
      name,
      displayName
    } = names;

    const staticContextData = {
      name,
      displayName,
      isInterruptable
    };

    if (isInterruptable) {
      if (isAsync && isGenerator) {
        this.node.Traces.getOrGenerateUniqueIdentifier('awCid');
        this.node.Traces.getOrGenerateUniqueIdentifier('genCid');
        staticContextData.type = StaticContextType.ResumeAsyncGen;
      }
      else if (isAsync) {
        // future-work: don't use unnamed constants ('awCid')
        this.node.Traces.getOrGenerateUniqueIdentifier('awCid');
        staticContextData.type = StaticContextType.ResumeAsync;
      }
      else /* if (isGenerator) */ {
        this.node.Traces.getOrGenerateUniqueIdentifier('genCid');
        staticContextData.type = StaticContextType.ResumeGen;
      }
    }
    else {
      staticContextData.type = StaticContextType.Function;
    }

    // this.node.getPlugin('StaticContext')

    /** ########################################
     * TODO: move this whole part to `StaticContext`
     * #######################################*/

    const staticContextId = state.contexts.addStaticContext(path, staticContextData);
    // const pushTraceCfg = addContextTrace(bodyPath, state, TraceType.PushImmediate);

    // this.node.debug(`ENTER #${staticContextId} [${StaticContextType.nameFrom(staticContextData.type)}] "${staticContextData.displayName}"`);

    // TODO: use `const pushTrace = Traces.addTrace` instead
    const staticPushTid = state.traces.addTrace(
      bodyPath,
      {
        type: TraceType.PushImmediate
      }
    );

    /**
     * @type {StaticContext}
     */
    const contextPlugin = this.node.getPlugin('StaticContext');

    // `genContext` adds `contextIdVar` to this.StaticContext
    contextPlugin.genContext();


    // let staticResumeContextId;
    // if (isInterruptable) {
    //   // TODO: also add this to top-level context, if it contains `await`
    //   staticResumeContextId = addResumeContext(bodyPath, state, staticContextId, staticContextData.type);
    // }

    this.data = {
      staticContextId,
      staticPushTid,
      // pushTraceCfg,
      // staticResumeContextId
    };
  }

  exit1() {
    /**
     * NOTE: this must be in `exit1`, because it must happen before `body` exit.
     */
    // const { node, node: { path } } = this;
    // const idPath = path.get('id');
    const { node } = this;
    this.data.paramTraces = node.getPlugin('Params').addParamTraces();
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

    // Verbose
    // const { popTraceCfg: pop, staticContextId } = this.data;
    // const { inProgramStaticTraceId } = pop;
    // // const staticTrace = this.node.state.traces.getById(inProgramStaticTraceId);
    // // const { displayName, loc } = staticTrace;
    // const staticContext = this.node.state.contexts.getById(staticContextId);
    // const { displayName, loc } = staticContext;
    // const { filePath } = this.node.peekNodeForce('Program').staticProgramContext;
    // const where = `${filePath}:${locToString(loc)}`;
    // this.node.logger.debug(`[popFunction] #${inProgramStaticTraceId} @${where} "${displayName.replace(/\s+/g, ' ')}"`);
  }


  // ###########################################################################
  // buildPush
  // ###########################################################################

  injectParamsTrace() {
    const { state, path } = this.node;
    const { paramTraces } = this.data;

    const p = buildRegisterParams(state, paramTraces);

    // insert parameter traces at the top
    path.get('body').unshiftContainer("body", p);
  }

  buildPush = () => {
    const {
      isInterruptable,
      data: {
        staticContextId, staticPushTid //, staticResumeContextId
      }
    } = this;
    const { state } = this.node;
    const {
      ids: {
        aliases: {
          pushImmediate
        }
      }
    } = state;

    const contextIdVar = this.node.getRealContextIdVar();
    const definitionTid = this.functionTraceCfg.tidIdentifier;

    const { ids: { dbux } } = state;

    if (isInterruptable) {
      const staticResumeContextId = staticContextId;
      return [
        pushResumeTemplate({
          dbux,
          contextIdVar,
          // resumeContextId,
          // NOTE: `realContextId` and `contextType` will be determined by RuntimeMonitor.pushResume.
          realContextId: ZeroNode,
          resumeStaticContextId: t.numericLiteral(staticResumeContextId),
          inProgramStaticTraceId: t.numericLiteral(staticPushTid),
          definitionTid
        })
      ];
    }

    return [
      pushImmediateTemplate({
        contextIdVar,
        pushImmediate,
        staticContextId: t.numericLiteral(staticContextId),
        inProgramStaticTraceId: t.numericLiteral(staticPushTid),
        definitionTid,

        // TODO: remove this
        isInterruptable: t.booleanLiteral(false)
      })
    ];
  }

  // ###########################################################################
  // buildPop
  // ###########################################################################

  buildPop = () => {
    const {
      popTraceCfg
    } = this.data;
    const { state } = this.node;
    const {
      ids: {
        aliases
      }
    } = state;

    const contextIdVar = this.node.getRealContextIdVar();


    // NOTE: this is based on `buildTraceStatic`
    // future-work: use `buildTraceStatic` instead
    const { inProgramStaticTraceId } = popTraceCfg;
    const args = [contextIdVar, t.numericLiteral(inProgramStaticTraceId)];
    this.node.StaticContext.addInterruptableContextArgs(args);

    const popCall = this.isInterruptable ? aliases.popFunctionInterruptable : aliases.popFunction;

    return t.expressionStatement(
      t.callExpression(popCall, args)
    );
  }

  instrument1() {
    // convert lambda expression to block with return statement
    this.node.path.ensureBlock();
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
      isInterruptable,
      isGenerator,
      node: { path, dontInstrumentContextEnd },
      // data: {
      //   staticPushTid,
      //   staticResumeContextId,
      //   contextIdVar,
      //   popTraceCfg
      // }
    } = this;

    // future-work: warn of eval
    //      -> maybe try instrumenting it if it is a simple string?
    //      -> consider bundling `@dbux/babel-plugin` and `@babel/register` with runtime in case of eval?
    const bodyPath = path.get('body');

    let pushes = this.buildPush();
    let pops = [
      this.buildPop()
    ];

    /** ########################################
     * ContextEnd
     * #######################################*/

    let bodyNode = bodyPath.node;
    if (!dontInstrumentContextEnd) {
      const lastNode = getLastNodeOfBody(bodyNode);
      if (!lastNode || !doesNodeEndScope(lastNode)) {
        // add ContextEnd trace
        // console.debug(`injecting EndOfContext for: ${bodyPath.toString()}`);
        // path.scope.crawl();
        const contextEndTrace = buildContextEndTrace(path, state);
        if (Array.isArray(bodyNode)) {
          bodyNode.push(contextEndTrace);
        }
        else {
          if (!t.isBlockStatement(bodyNode)) {
            // NOTE: we called `ensureBlock` above
            throw new Error(`Function body is neither array nor block statement: "${pathToStringAnnotated(path, true)}"`);
          }
          bodyPath.pushContainer("body", contextEndTrace);
        }
        // injectContextEndTrace(path, state);
      }
    }

    /** ########################################
     * interruptable functions
     * #######################################*/

    if (isInterruptable) {
      // this is an interruptable function -> push + pop "resume contexts"

      // pushes = [
      //   ...pushes,
      // ];
      // pops = [
      //   // popResumeTemplate({
      //   //   dbux,
      //   //   // resumeContextId,
      //   //   // traceId: t.numericLiteral(popTraceCfg.tidIdentifier),
      //   //   // contextId: contextIdVar
      //   // }),
      //   ...pops
      // ];
    }

    // wrap the function in a try/finally statement
    wrapPushPopBlock(bodyPath, pushes, pops);
  }
}

/**
 * Hackfix: webpack, renames `class Function` to `class Function_Function`, but only in production mode (even with `optimization` disabled).
 */
Function.nameOverride = 'Function';
