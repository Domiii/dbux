/**
 * @file
 */

import isFunction from 'lodash/isFunction';
import { newLogger } from '@dbux/common/src/log/logger';

import ParseDirection from './ParseDirection';
import ParseRegistry from './ParseRegistry';

import { isPathInstrumented } from '../helpers/astUtil';
import { pathToString } from '../helpers/pathHelpers';

/**
 * @typedef {import('./ParseStack').default} ParseStack
 * @typedef {import('./ParseNode').default} ParseNode
 * 
 * @typedef {Object} DbuxState
 * @property {ParseStack} stack
 */

// const Verbose = 0;
const Verbose = 1;
// const Verbose = 2;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('traceVisitors');

// ###########################################################################
// new visit
// ###########################################################################

function visitEnter(ParserNodeClazz, path, state) {
  // return visit(InstrumentationDirection.Enter, state.onTrace.bind(state), enterInstrumentors, path, state, visitorCfg);
  if (!state.onTrace(path)) {
    return;
  }
  visit(ParseDirection.Enter, ParserNodeClazz, path, state);
}
function visitExit(ParserNodeClazz, path, state) {
  // return visit(InstrumentationDirection.Exit, state.onTraceExit.bind(state), exitInstrumentors, path, state, visitorCfg);
  if (!state.onTraceExit(path)) {
    return;
  }
  visit(ParseDirection.Exit, ParserNodeClazz, path, state);
}

/**
 * @param {*} path 
 * @param {DbuxState} state
 */
function visit(direction, ParserNodeClazz, path, state) {
  if (isPathInstrumented(path)) {
    // path.skip();
    // return;
    throw new Error(`Visiting already instrumented path. Should not happen.`);
  }

  state.stack.checkGen();
  // if (state.stack.isGen) {
  //   // we are already in `gen` -> stop the whole shazam
  //   path.stop();
  //   return;
  // }


  Verbose && logInst('v', path, direction, ParserNodeClazz);

  if (direction === ParseDirection.Enter) {
    // -> Enter
    state.stack.enter(path, ParserNodeClazz);
  }
  else {
    // <- Exit
    state.stack.exit(path, ParserNodeClazz);
  }
}

// ###########################################################################
// utilities
// ###########################################################################

function logInst(tag, path, direction = null, ParserNodeClazz, ...other) {
  // // const nodeName = getNodeNames(path.node)?.name;
  // const dirIndicator = direction && direction === ParseDirection.Enter ? ' ->' : ' <-';
  // debug(
  //   `[${tag}]${dirIndicator || ''}`,
  //   // `${cfgName}:`,
  //   `${ParserNodeClazz.name}:`,
  //   // nodeName &&
  //   //   `${path.node.type} ${nodeName}` ||
  //   pathToString(path),
  //   // TraceInstrumentationType.nameFromForce(instrumentationType),
  //   ...other
  // );
}

// ###########################################################################
// some extra visitor logic
// ###########################################################################

// const builtInVisitors = {
//   Program: {
//     enter() { },
//     exit(path) {
//       path.stop();
//     }
//   }
// };

// function patchProgram(visitors) {
//   const origProg = visitors.Program;
//   visitors.Program.exit = (...args) => {
//     origProg?.exit(...args);
//     const [path] = args;
//     path.stop();
//   };
// }

// ###########################################################################
// buildVisitors
// ###########################################################################

/**
 * hackfix: JS has no reliable way to determine whether something is a `class`
 * 
 * @see https://stackoverflow.com/a/30760236
 */
function isClassGuess(v) {
  return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
}

export function buildVisitors() {
  const visitors = {};
  const { ParseNodeClassesByName } = ParseRegistry;
  for (const name in ParseNodeClassesByName) {
    const ParserNodeClazz = ParseNodeClassesByName[name];

    if (!isClassGuess(ParserNodeClazz)) {
      throw new Error(`ParserNode clazz is not a class: ${name} - ${ParserNodeClazz}`);
    }

    const names = ParserNodeClazz.visitors || [name];
    for (const visitorName of names) {
      visitors[visitorName] = {
        enter(path, state) {
          // if (path.getData()) {
          //   visit(state.onTrace.bind(state), enterInstrumentors, path, state, visitorCfg)
          // }
          // builtInVisitors[name]?.enter?.(path, state);
          visitEnter(ParserNodeClazz, path, state);
        },

        exit(path, state) {
          visitExit(ParserNodeClazz, path, state);
          // builtInVisitors[name]?.exit?.(path, state);
        }
      };
    }
  }
  return visitors;
}