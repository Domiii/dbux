// import template from '@babel/template';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import { astNodeToString, pathToString } from '../../helpers/pathHelpers';
import { buildTraceCall, bindTemplate, bindExpressionTemplate } from '../../helpers/templateUtil';
import { makeInputs, ZeroNode } from './buildHelpers';
import { getInstrumentTargetAstNode } from './common';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/trace');

const Verbose = 2;

export const buildTraceId = bindExpressionTemplate(
  '%%traceId%% = %%newTraceId%%(%%staticTraceId%%)',
  function buildTraceId(state, { tidIdentifier, inProgramStaticTraceId }) {
    const { ids: { aliases: {
      newTraceId
    } } } = state;

    return {
      newTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId),
      traceId: tidIdentifier
    };
  },
);

// ###########################################################################
// traceExpression
// ###########################################################################

/**
 * 
 */
export const buildTraceExpression = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%declarationTid%%, %%inputs%%)',
  function buildTraceExpression(state, traceCfg) {
    // const { scope } = path;
    const { ids: { aliases } } = state;
    const trace = aliases[traceCfg?.meta?.traceCall || 'traceExpression'];
    if (!trace) {
      throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
    }

    const {
      declarationTidIdentifier,
      inputTraces
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);
    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, pathToString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      trace,
      expr: getInstrumentTargetAstNode(traceCfg),
      tid,
      declarationTid: declarationTidIdentifier || ZeroNode,
      inputs: makeInputs(inputTraces)
    };
  }
);

/**
 * 
 */
export const buildTraceExpressionNoInput = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%declarationTid%%)',
  function buildTraceExpressionNoInput(state, traceCfg) {
    // const { scope } = path;
    const { ids: { aliases } } = state;
    const trace = aliases[traceCfg?.meta?.traceCall || 'traceExpression'];
    if (!trace) {
      throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
    }

    const {
      declarationTidIdentifier
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);
    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, pathToString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      trace,
      expr: getInstrumentTargetAstNode(traceCfg),
      tid,
      declarationTid: declarationTidIdentifier || ZeroNode
    };
  }
);

/**
 * Same as `buildTraceExpression` but without declaration nor inputs.
 */
export const buildTraceExpressionSimple = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%)',
  function buildTraceExpressionSimple(state, traceCfg) {
    const { ids: { aliases } } = state;
    const trace = aliases[traceCfg?.meta?.traceCall || 'traceExpression'];
    if (!trace) {
      throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
    }

    const tid = buildTraceId(state, traceCfg);
    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, pathToString(expressionNode));
    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      trace,
      expr: getInstrumentTargetAstNode(traceCfg),
      tid
    };
  }
);

// ###########################################################################
// traceDeclaration
// ###########################################################################

export function buildTraceDeclarations(state, traceCfgs) {
  const { ids: { aliases, aliases: {
    traceDeclaration
  } } } = state;

  const decls = traceCfgs.map(({ tidIdentifier, inProgramStaticTraceId, data, meta }) => {
    const trace = meta?.traceCall && aliases[meta.traceCall] || traceDeclaration;
    const args = [t.numericLiteral(inProgramStaticTraceId)];

    const valuePath = data?.valuePath;
    if (valuePath) {
      args.push(valuePath.node);
    }

    return t.variableDeclarator(
      tidIdentifier,
      t.callExpression(trace, args)
    );
  });
  return t.variableDeclaration('var', decls);
}

// ###########################################################################
// traceWriteVar
// ###########################################################################

// TODO: deferTid
export const buildTraceWriteVar = buildTraceCall(
  '%%traceWriteVar%%(%%expr%%, %%tid%%, %%declarationTid%%, %%inputs%%, %%deferTid%%)',
  function buildTraceWriteVar(state, traceCfg) {
    const { ids: { aliases: {
      traceWriteVar
    } } } = state;

    const {
      declarationTidIdentifier,
      inputTraces
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);

    const declarationTid = declarationTidIdentifier || ZeroNode;
    const deferTid = ZeroNode;

    return {
      expr: getInstrumentTargetAstNode(traceCfg),
      traceWriteVar,
      tid,
      declarationTid,
      inputs: makeInputs(inputTraces),
      deferTid
    };
  }
);

// ###########################################################################
// traceNoValue
// ###########################################################################

/**
 * TODO: rewrite using `traceCfg`
 * @deprecated
 */
export const buildTraceNoValue = bindTemplate(
  '%%dbux%%.t(%%traceId%%)',
  function buildTraceNoValue(path, state, staticTraceData) {
    const { ids: { dbux } } = state;
    const traceId = state.traces.addTrace(path, staticTraceData);
    // console.warn(`traces`, state.traces);
    return {
      dbux,
      traceId: t.numericLiteral(traceId)
    };
  }
);

// ###########################################################################
// traceMemberExpression
// ###########################################################################

function getMEObjectNode(meNode, traceCfg) {
  return traceCfg.data.objectNode || meNode.object;
}

function getMEPropNode(meNode) {
  let prop = meNode.property;
  if (!meNode.computed) {
    let propName;
    if (!t.isIdentifier(prop)) {
      // NOTE: should never happen
      logError(`ME property was not computed and NOT identifier: ${astNodeToString(meNode)}`);
      propName = prop.name || prop.toString();
    }
    else {
      propName = prop.name;
    }
    // NOTE: `o.x` becomes `tme(..., 'x', ...)`
    //      -> convert `Identifier` to `StringLiteral`
    prop = t.stringLiteral(propName);
  }
  return prop;
}

export const buildTraceMemberExpression = bindExpressionTemplate(
  '%%tme%%(%%objValue%%, %%propValue%%, %%tid%%, %%inputs%%)',
  function buildTraceMemberExpression(state, traceCfg) {
    // const { scope } = path;
    const meNode = getInstrumentTargetAstNode(traceCfg);
    const { ids: { aliases } } = state;
    const trace = aliases[traceCfg?.meta?.traceCall || 'traceMemberExpression'];
    if (!trace) {
      throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
    }

    const {
      inputTraces
    } = traceCfg;
    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, pathToString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      tme: trace,

      /**
       * NOTE: actual `object` node might have been moved; e.g. by `CalleeMemberExpression`
       */
      objValue: getMEObjectNode(meNode, traceCfg),

      /**
       * NOTE: we are getting the `prop` here (and not earlier), to make sure its the final instrumented version.
       */
      propValue: getMEPropNode(meNode),
      tid: buildTraceId(state, traceCfg),
      inputs: makeInputs(inputTraces)
    };
  }
);


// ###########################################################################
// traceWriteME
// ###########################################################################

/**
 * NOTE: order arguments enforces order of execution!
 * TODO: deferTid
 * @example
 * ```js
 * function f(msg, value) { console.log(msg, value); return value; }
 * var o = {};
 * f(1, o)[f(2, 'prop')] = f(3, 'value')
 * o
 * ```
 */
export const buildTraceWriteME = buildTraceCall(
  '%%traceWriteME%%(%%objValue%%, %%propValue%%, %%rVal%%, %%tid%%, %%objTid%%, %%inputs%%, %%deferTid%%)',
  function buildTraceWriteME(state, traceCfg) {
    const { ids: { aliases: {
      traceWriteME
    } } } = state;

    const assignmentNode = getInstrumentTargetAstNode(traceCfg);
    const {
      left: meNode,
      right: rVal
    } = assignmentNode;

    const {
      inputTraces,
      data: {
        objTid
      }
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);
    const deferTid = ZeroNode;

    return {
      traceWriteME,
      objValue: getMEObjectNode(meNode, traceCfg),

      /**
       * NOTE: we are getting the `prop` in this method (and not earlier), to make sure its the final instrumented version.
       */
      propValue: getMEPropNode(meNode),
      rVal,
      tid,
      objTid,
      inputs: makeInputs(inputTraces),
      deferTid
    };
  }
);