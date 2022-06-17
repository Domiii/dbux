import isFunction from 'lodash/isFunction';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { pathGetBasename } from '@dbux/common/src/util/pathUtil';

import StaticContextCollection from './data/StaticContextCollection';
import StaticTraceCollection from './data/StaticTraceCollection';
import StaticLoopCollection from './data/StaticLoopCollection';
import { isNodeInstrumented } from './helpers/astUtil';
import ParseStack from './parseLib/ParseStack';

import * as ParseNodeClassesByName from './parse/_registry';
import * as PluginClassesByName from './parse/plugins/_registry';

import ParseRegistry from './parseLib/ParseRegistry';

import { version } from '../package.json';

/** ###########################################################################
 * {@link VerboseSettings}
 * ##########################################################################*/

/**
 * Basic first steps toward proper configurable logging.
 */
export class VerboseSettings {
  nyi = 0;
}

// ###########################################################################
// init parser
// ###########################################################################

ParseRegistry.init(ParseNodeClassesByName, PluginClassesByName);

// ###########################################################################
// Build custom dbux state object
// ###########################################################################

let unknownCount = 0;
let iProgram = 0;

/**
 * Build the state used by dbux-babel-plugin throughout the entire AST visit.
 */
export default function injectDbuxState(programPath, programState) {
  const buildCfg = programState.opts || EmptyObject;

  const {
    filenameOverride: filenameOverrideOrFn,
    runtime: runtimeCfg
  } = buildCfg;
  const filenameOverride = filenameOverrideOrFn && (isFunction(filenameOverrideOrFn) ? filenameOverrideOrFn(programState) : filenameOverrideOrFn);
  // console.warn('options', JSON.stringify(buildCfg), filenameOverride);
  const filePath = filenameOverride || programState.filename || `__unnamed_script_${++unknownCount}.js`;
  const fileName = filePath && pathGetBasename(filePath);

  // console.warn('[@dbux/babel-plugin]', filePath); // Object.keys(programState), ' ## ', JSON.stringify(_buildCfg));

  const { scope } = programPath;
  const { file: programFile } = programState;

  const programUid = ++iProgram;

  function makeProgramId(name) {
    // NOTE: This is because we might have multiple dbux programs in the same context (e.g. multiple <script> tags in same HTML file)
    //        So we want to add `iProgram` for unique flavor (which works if they are all instrumented by the same process).
    // TODO: fix this. Babel seems to remove the number suffix anyway.
    return scope.generateUidIdentifier(name + programUid);
  }

  const dbuxState = {
    version,
    runtimeCfg,
    verbose: new VerboseSettings(),

    // static program data
    programFile,
    filePath,
    fileName,

    contexts: new StaticContextCollection(programState),
    traces: new StaticTraceCollection(programState),
    loops: new StaticLoopCollection(programState),
    // currentContextIdentifier: null,

    ids: {
      dbuxInit: scope.generateUidIdentifier('dbux_init'),
      dbuxRuntime: scope.generateUidIdentifier('dbuxRuntime'),

      dbux: makeProgramId('dbux'),
      dbuxClass: scope.generateUidIdentifier('__dbux_class'),
      dbuxInstance: scope.generateUidIdentifier('__dbux_instance'),

      aliases: {
        // utilities
        getArgLength: makeProgramId('al'),
        arrayFrom: makeProgramId('af'),
        unitOfType: makeProgramId('uot'),
        DefaultInitializerIndicator: makeProgramId('dfi'),

        // Function
        pushImmediate: makeProgramId('pI'),
        popFunction: makeProgramId('pF'),
        popFunctionInterruptable: makeProgramId('pFI'),
        registerParams: makeProgramId('par'),
        traceReturn: makeProgramId('tr'),
        traceReturnAsync: makeProgramId('tra'),
        traceThrow: makeProgramId('tt'),

        // misc
        newTraceId: makeProgramId('tid'),
        traceDeclaration: makeProgramId('td'),
        traceExpression: makeProgramId('te'),
        traceExpressionVar: makeProgramId('tev'),
        traceWriteVar: makeProgramId('twv'),
        traceCatch: makeProgramId('tct'),
        traceCatchInterruptable: makeProgramId('tctI'),
        traceFinally: makeProgramId('tf'),
        traceFinallyInterruptable: makeProgramId('tfI'),

        // ME
        traceExpressionME: makeProgramId('tme'),
        traceExpressionMEOptional: makeProgramId('tmeo'),
        traceWriteME: makeProgramId('twme'),
        traceDeleteME: makeProgramId('tdme'),

        // UE
        traceUpdateExpressionVar: makeProgramId('tue'),
        traceUpdateExpressionME: makeProgramId('tume'),

        // calls
        traceBCE: makeProgramId('bce'),
        traceArg: makeProgramId('a'),
        traceSpreadArg: makeProgramId('tsa'),
        traceCallResult: makeProgramId('tcr'),

        // {Array,Object}Expression
        traceArrayExpression: makeProgramId('tae'),
        traceObjectExpression: makeProgramId('toe'),

        // loops
        traceForIn: makeProgramId('tfi'),

        // classes
        traceClass: makeProgramId('tc'),
        traceInstance: makeProgramId('ti'),

        // async
        preAwait: makeProgramId('aw0'),
        wrapAwait: makeProgramId('aw1'),
        postAwait: makeProgramId('aw2'),

        // generator functions
        preYield: makeProgramId('yi0'),
        wrapYield: makeProgramId('yi1'),
        postYield: makeProgramId('yi2'),
        // traceAwaitResult: makeProgramId('aw3')

        // patterns
        tracePattern: makeProgramId('tp'),

        // purpose
        addPurpose: makeProgramId('apu')
      }
    },

    // ###########################################################################
    // getters
    // ###########################################################################

    getClosestAncestorData(path, dataName) {
      const staticContextParent = path.findParent(p => !!p.getData(dataName));
      return staticContextParent?.getData(dataName);
    },


    // ###########################################################################
    // visitor check-ins
    // ###########################################################################

    onTrace(path) {
      return dbuxState.onEnter(path, 'trace');
    },

    onTraceExit(path) {
      return dbuxState.onExit(path, 'trace');
    },

    /**
     * NOTE: each node might be visited more than once.
     * This function keeps track of that and returns whether this is the first time visit.
     */
    onEnter(path, purpose) {
      const key = 'enter_' + purpose;
      if (path.getData(key)) {
        return false;
      }
      // if (entered.has(path)) {
      //   return false;
      // }

      // NOTE: gen happens after parsing now
      // if (!path.node || isNodeInstrumented(path.node)) {
      //   // this node has been dynamically emitted; not part of the original source code -> not interested in it
      //   return false;
      // }

      // remember our visit
      dbuxState.markEntered(path, purpose);

      return true;
    },

    /**
     * NOTE: each node might be visited more than once.
     * This function keeps track of that and returns whether this is the first time visit.
     */
    onExit(path, purpose) {
      const key = 'exit_' + purpose;
      if (path.getData(key)) {
        return false;
      }
      // if (entered.has(path)) {
      //   return false;
      // }
      if (!path.node || isNodeInstrumented(path.node)) {
        // this node has been dynamically emitted; not part of the original source code -> not interested in it
        return false;
      }

      // remember our visit
      dbuxState.markExited(path, purpose);

      return true;
    },

    markEntered(path, purpose) {
      if (!purpose) {
        throw new Error('Could not mark path because no purpose was given:\n' + path.toString());
      }
      const key = 'enter_' + purpose;
      // entered.add(path);
      path.setData(key, true);
    },


    markExited(path, purpose) {
      if (!purpose) {
        throw new Error('Could not mark path because no purpose was given:\n' + path.toString());
      }
      const key = 'exit_' + purpose;
      // entered.add(path);
      path.setData(key, true);
    },

    markVisited(path, purpose) {
      // WARNING: when something is instrumented for multiple purposes (e.g. purposes A and B):
      //  1. A creates a copy of the node (and thus will not be visited by A again)
      //  2. then B creates a copy of the node (and thus will not be visited by B again)
      //  3. since B created another copy of the node and that is marked as visited by A
      dbuxState.markEntered(path, purpose);
      // dbuxState.markExited(path); // not necessary for now
    },

    // ###########################################################################
    // utilities
    // ###########################################################################

    /**
     * Problem: If paths are wrapped using `@babel/template`, only their nodes get copied, thus all associated `data` in path is lost.
     * This method keeps track of that.
     * It also marks it as visited by purpose (if purpose is given), to prevent infinitely revisiting the same path.
     */
    onCopy(oldPath, newPath, purpose = null) {
      newPath.data = oldPath.data;
      purpose && this.markVisited(newPath, purpose);
    }
  };

  Object.assign(programState, dbuxState);

  programState.stack = new ParseStack(programState);

  return programState;
}