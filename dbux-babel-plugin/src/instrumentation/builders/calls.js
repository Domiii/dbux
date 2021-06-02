import template from '@babel/template';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import { getPresentableString } from '../../helpers/pathHelpers';
import { /* buildTraceCall, */ bindTemplate, bindExpressionTemplate } from '../../helpers/templateUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/trace');

/**
 * Call templates if callee is MemberExpression.
 * NOTE: the call templates do not have arguments. We will put them in manually, so as to avoid loss of path data.
 * NOTE: the `null` expression (i.e. `newPath.get('expressions.2')`) is a placeholder for BCE id.
 */
const callTemplatesMember = {
  // NOTE: `f.call.call(f, args)` also works 
  //        i.e. `f.call(this, 1);`
  //          -> `f.call.call(f, this, 1))`
  CallExpression: () => template(`
  %%o%% = %%oNode%%,
    %%f%% = %%fNode%%,
    null,
    %%f%%.call(%%o%%)
  `),

  /**
   * @see https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js
   */
  OptionalCallExpression: () => template(`
  %%o%% = %%oNode%%,
    %%f%% = %%fNode%%,
    null,
    %%f%%?.call(%%o%%)
  `),

  NewExpression: () => template(`
  %%o%% = %%oNode%%,
    %%f%% = %%fNode%%,
    null,
    new %%f%%()
`)
};

/**
 * Call templates if callee is Identifier.
 */
const callTemplatesVar = {
  CallExpression: template(`
    %%f%% = %%fNode%%,
    null,
    %%f%%()
  `),

  /**
   * @see https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js
   */
  OptionalCallExpression: template(`
    %%f%% = %%fNode%%,
    null,
    %%f%%?.()
  `),

  NewExpression: template(`
    %%f%% = %%fNode%%,
    null,
    new %%f%%()
  `)
};

// ###########################################################################
// traceCallArgument
// ###########################################################################

const callTemplate = '';

export function buildTraceCallVar() {

}

// export const buildTraceCallArgument = buildTraceCall(
//   '%%traceCallArgument%%(%%expr%%, %%tid%%, %%declarationTid%%, %%calleeTid%%, %%inputs%%)',
//   function buildTraceCallArgument(expr, state, traceCfg) {
//     const { ids: { aliases: {
//       traceCallArgument
//     } } } = state;

//     const {
//       declarationTidIdentifier,
//       inputTraces,
//       calleeTid
//     } = traceCfg;

//     const tid = buildTraceId(state, traceCfg);

//     const declarationTid = declarationTidIdentifier || ZeroNode;

//     return {
//       expr,
//       traceCallArgument,
//       tid,
//       declarationTid,
//       inputs: makeInputs(inputTraces),
//       calleeTid
//     };
//   }
// );

