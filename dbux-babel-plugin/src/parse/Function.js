import template from '@babel/template';
import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import VarOwnerType from '@dbux/common/src/core/constants/VarOwnerType';
import { buildWrapTryFinally, buildSource, buildBlock } from '../helpers/builders';
import { injectContextEndTrace } from '../helpers/contextHelper';
import { traceWrapExpressionStatement } from '../helpers/traceHelpers.old';
import { getNodeNames } from '../visitors/nameVisitors';

import BaseNode from './BaseNode';
import { doesNodeEndScope } from '../helpers/astUtil';


// ###########################################################################
// builders + templates
// ###########################################################################

function buildPushImmediate(contextId, dbux, staticId, traceId, isInterruptable) {
  // TODO: use @babel/template instead
  return buildSource(`var ${contextId} = ${dbux}.pushImmediate(${staticId}, ${traceId}, ${isInterruptable});`);
}

function buildPopFunction(contextIdVar, dbux, traceId) {
  // TODO: use @babel/template instead
  return buildSource(`${dbux}.popFunction(${contextIdVar}, ${traceId});`);
}

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


// ###########################################################################
// Function
// ###########################################################################

function getLastNodeOfBody(bodyNode) {
  const nodes = Array.isArray(bodyNode) ? bodyNode : bodyNode.body;
  return nodes[nodes.length - 1];
}

export default class Function extends BaseNode {
  pluginNames = [
    'StaticContext',
    'BindingNode'
  ];

  enter() {
    const { path, state } = this;
    
    const isGenerator = path.node.generator;
    const isAsync = path.node.async;
    const isInterruptable = isGenerator || isAsync;
    const bodyPath = path.get('body');

    const {
      name,
      displayName
    } = this.data.names;

    const staticContextData = {
      type: 2, // {StaticContextType}
      name,
      displayName,
      isInterruptable
    };
    const staticContextId = state.contexts.addStaticContext(path, staticContextData);
    const pushTraceId = state.traces.addTrace(bodyPath, TraceType.PushImmediate);
    const popTraceId = state.traces.addTrace(bodyPath, TraceType.PopImmediate);

    // // add varAccess
    // const ownerId = staticContextId;

    // TODO: also trace `this`?
    // state.varAccess.addVarAccess(path, ownerId, VarOwnerType.Context, 'this', false);

    // const params = path.get('params');
    // const paramIds = params.map(param =>
    //   // get all variable declarations in `param`
    //   // see: https://github.com/babel/babel/tree/master/packages/babel-traverse/src/path/family.js#L215
    //   // see: https://github.com/babel/babel/tree/master/packages/babel-traverse/src/path/lib/virtual-types.js
    //   Object.values(param.getBindingIdentifierPaths())
    // ).flat();
    // let recordParams = paramIds.map(paramPath => {
    //   state.varAccess.addVarAccess(
    //     paramPath.node.name, paramPath, ownerId, VarOwnerType.Trace
    //   );
    //   return traceWrapExpressionStatement(TraceType.Parameter, paramPath, state);
    // });

    let staticResumeContextId;
    if (isInterruptable) {
      staticResumeContextId = addResumeContext(bodyPath, state, staticContextId);
    }

    return {
      staticContextId,
      pushTraceId,
      popTraceId,
      // recordParams,
      staticResumeContextId
    };
  }


  // ###########################################################################
  // instrument
  // ###########################################################################

  genStaticData() {
    // TODO
    return {};
  }

  /**
   * Instrument all Functions to keep track of all (possibly async) execution stacks.
   */
  instrument() {
    const {
      staticContextId, pushTraceId, popTraceId, recordParams, staticResumeContextId
    } = this.data;

    // TODO: warn of eval
    //      -> maybe try instrumenting it if it is a simple string?
    //      -> consider bundling `@dbux/babel-plugin` and `@babel/register` with runtime in case of eval?

    const { path, state } = this;
    const { ids: { dbux }, contexts: { genContextIdName } } = state;
    const bodyPath = path.get('body');
    const contextIdVar = genContextIdName(bodyPath);

    let pushes = buildPushImmediate(contextIdVar, dbux, staticContextId, pushTraceId, !!staticResumeContextId);
    let pops = buildPopFunction(contextIdVar, dbux, popTraceId);
    if (staticResumeContextId) {
      // this is an interruptable function -> push + pop "resume contexts"
      // const resumeContextId = bodyPath.scope.generateUid('resumeContextId');
      pushes = [
        ...pushes,
        pushResumeTemplate({
          dbux,
          // resumeContextId,
          resumeStaticContextId: t.numericLiteral(staticResumeContextId),
          traceId: t.numericLiteral(pushTraceId)
        })
      ];

      pops = [
        popResumeTemplate({
          dbux,
          // resumeContextId,
          // traceId: t.numericLiteral(popTraceId)
          // contextId: contextIdVar
        }),
        ...pops
      ];
    }

    const origBodyNode = bodyPath.node;
    let bodyNode = origBodyNode;
    if (!Array.isArray(origBodyNode) && !t.isStatement(origBodyNode)) {
      // simple lambda expression -> convert to block lambda expression with return statement, so we can have our `try/finally`
      bodyNode = t.blockStatement([t.returnStatement(origBodyNode)]);

      // patch return loc to keep loc of original expression (needed for `ReturnStatement` `traceVisitor`)
      bodyNode.body[0].loc = origBodyNode.loc;
      bodyNode.body[0].argument.loc = origBodyNode.loc;
    }
    else if (!doesNodeEndScope(getLastNodeOfBody(bodyNode))) {
      // add ContextEnd trace
      // console.debug(`injecting EndOfContext for: ${bodyPath.toString()}`);
      injectContextEndTrace(bodyPath, state);
    }

    // wrap the function in a try/finally statement
    const newBody = buildBlock([
      ...pushes,
      // ...recordParams,
      buildWrapTryFinally(bodyNode, pops)
    ]);

    // patch function body node to keep loc of original body (needed for `injectFunctionEndTrace`)
    newBody.loc = origBodyNode.loc;
    // bodyPath.context.create(bodyNode, bodyNode, 'xx')
    bodyPath.replaceWith(newBody);

    // TODO: trace the function creation itself
    // TODO: trace all enclosed variables
  }

  // ###########################################################################
  // static
  // ###########################################################################

  static prospectOnEnter(path) {
    // const names = path.getData('_dbux_names');
    const names = getNodeNames(path.node);
    if (!names) {
      // this is probably an instrumented function
      return null;
    }
    return {
      names
    };
  }
}
