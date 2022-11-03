/**
 * @file
 */

import { newLogger } from '@dbux/common/src/log/logger';

import ParseDirection from './ParseDirection';
import ParseRegistry from './ParseRegistry';

import { isPathInstrumented } from '../helpers/astUtil';
import { pathToString, pathToStringAnnotated } from '../helpers/pathHelpers';
import { isPathSkipped } from '../helpers/traversalHelpers';

/**
 * @typedef {import('./ParseStack').default} ParseStack
 * @typedef {import('./ParseNode').default} ParseNode
 * 
 * @typedef {Object} DbuxState
 * @property {ParseStack} stack
 */


const Verbose = 1;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('visitors');

// ###########################################################################
// new visit
// ###########################################################################

/**
 * [ts-hackfix] remove (some) types
 */
function fixTypes(path) {
  // TODO: hackfix types away without losing sourcemapping?
}

/**
 * See {@link ParsePhase} for phase ordering.
 */
function visitEnter(ParserNodeClazz, path, state) {
  // return visit(InstrumentationDirection.Enter, state.onTrace.bind(state), enterInstrumentors, path, state, visitorCfg);
  if (!state.onTrace(path)) {
    return;
  }
  visit(ParseDirection.Enter, ParserNodeClazz, path, state);
}

/**
 * NOTE: triggers `Exit1` (not `Exit`)
 * See {@link ParsePhase} for phase ordering.
 */
function visitExit(ParserNodeClazz, path, state) {
  // return visit(InstrumentationDirection.Exit, state.onTraceExit.bind(state), exitInstrumentors, path, state, visitorCfg);
  if (!state.onTraceExit(path)) {
    return;
  }
  visit(ParseDirection.Exit, ParserNodeClazz, path, state);
}

/**
 * See {@link ParsePhase} for phase ordering.
 * 
 * @param {*} path 
 * @param {DbuxState} state
 */
function visit(direction, ParserNodeClazz, path, state) {
  if (isPathInstrumented(path)) {
    // path.skip();
    // return;
    // eslint-disable-next-line max-len
    const dirName = ParseDirection.nameFromForce(direction);

    Verbose && warn(
      `Visiting [${dirName}] already instrumented path: [${ParserNodeClazz.name}] "${pathToString(path)}".` +
      ` Make sure not to instrument before instrumentation phase; this includes calls to scope.generateDeclared* etc.`
    );
    // return;
  }

  state.stack.checkBeforeGen();
  // if (state.stack.isGen) {
  //   // we are already in `gen` -> stop the whole shazam
  //   path.stop();
  //   return;
  // }

  if (direction === ParseDirection.Enter) {
    // -> Enter
    state.stack.enter(path, ParserNodeClazz);
  }
  else {
    // <- Exit
    state.stack.exit1(path, ParserNodeClazz);
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

/**
 * Warning: There is an issue in Babel where comments on certain syntax elements are ignored.
 * @see https://github.com/babel/babel/issues/13511
 */
function checkDisabled(path) {
  // console.debug('checkDisabled', path.node.type, pathToString(path), '- Comments:', path.node.leadingComments);
  return path.node.leadingComments?.find(({ value }) => value?.trim().includes('dbux disable')) || false;
}

export function buildVisitors() {
  const visitors = {};
  const { ParseNodeClassesByName } = ParseRegistry;
  let disabled = 0;
  let level = 0;
  for (const name in ParseNodeClassesByName) {
    const ParserNodeClazz = ParseNodeClassesByName[name];

    if (!isClassGuess(ParserNodeClazz)) {
      throw new Error(`ParserNode clazz is not a class: ${name} - ${ParserNodeClazz}`);
    }

    const names = ParserNodeClazz.visitors || [name];
    for (const visitorName of names) {
      visitors[visitorName] = {
        // eslint-disable-next-line no-loop-func
        enter(path, state) {
          // if (path.getData()) {
          //   visit(state.onTrace.bind(state), enterInstrumentors, path, state, visitorCfg)
          // }
          // builtInVisitors[name]?.enter?.(path, state);
          // path.node && debug(`[${path.node.type}] ${pathToString(path, true)} ${path.node.leadingComments}`);
          // ++level;
          // debug(`${' '.repeat(level)}[Enter] ${level} ${pathToString(path)}`);
          if (disabled) {
            // debug(` (skipped path: ${pathToString(path, true)})`);
            return;
          }
          if (checkDisabled(path)) {
            ++disabled;
            debug(` (disabled path++: ${pathToString(path, true)})`);
            // path.skip(); // NOTE: `skip()` will also skip it for all other plugins
          }
          else {
            if (isPathSkipped(path)) {
              return;
            }
            // debug(`[visitEnter]`, path.node.type, state.filePath);
            visitEnter(ParserNodeClazz, path, state);
          }
        },

        // eslint-disable-next-line no-loop-func
        exit(path, state) {
          // debug(`${' '.repeat(level)}[Exit] ${pathToString(path)}`);
          // --level;
          if (disabled) {
            if (checkDisabled(path)) {
              --disabled;
              // debug(` (skipped path--: ${pathToString(path, true)})`);
            }
          }
          else {
            if (isPathSkipped(path)) {
              return;
            }
            visitExit(ParserNodeClazz, path, state);
          }
        }
      };
    }
  }
  return visitors;

  /**
   * Test `ReferencedIdentifier`.
   * @see https://github.com/Domiii/dbux/issues/602
   */
  // return {
  //   ReferencedIdentifier: {
  //     enter(path, state) {
  //       console.log('ReferencedIdentifier ENTER', path.parentPath.toString());
  //     },
  //     exit(path, state) {
  //       console.log('ReferencedIdentifier EXIT', path.parentPath.toString());
  //     }
  //   }
  // };
}
