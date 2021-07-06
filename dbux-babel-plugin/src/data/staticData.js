import { isPlainObject } from 'lodash';
import isString from 'lodash/isString';
import { buildSource } from '../instrumentation/builders/common';

const Verbose = false;
// const Verbose = true;

export function buildDbuxInit(state) {
  const {
    ids,
    fileName,
    filePath,
    contexts,
    traces,
    loops,
    runtimeCfg
  } = state;
  const {
    dbuxInit,
    // dbuxRuntime
  } = ids;

  const staticData = {
    fileName,
    filePath,

    contexts: contexts._all,
    traces: traces._all,
    loops: loops._all
  };

  // // const staticDataString = JSON.stringify(staticData, null, 4);
  // Verbose && console.time(`[Dbux] babel write 1 (stringify) "${filePath}"`);
  const staticDataString = JSON.stringify(staticData);
  let runtimeCfgString = '{}';
  if (runtimeCfg) {
    if (isString(runtimeCfg)) {
      try {
        JSON.parse(runtimeCfg);
        runtimeCfgString = runtimeCfg;
      }
      catch (err) {
        throw new Error(`Invalid runtimeCfg is string but not JSON-parsable - "${err.message}": "${runtimeCfg}"`);
      }
    }
    else if (isPlainObject(runtimeCfg)) {
      try {
        runtimeCfgString = JSON.stringify(runtimeCfg);
      }
      catch (err) {
        throw new Error(`Invalid runtimeCfg is object but not JSON-stringifyable - "${err.message}": "${runtimeCfg}"`);
      }
    }
    else {
      throw new Error(`Invalid runtimeCfg must be string or object but was: "${runtimeCfg}"`);
    }

    Verbose && console.debug(`Received runtime cfg: ${runtimeCfgString}`);
  }

  // Verbose && console.debug(`Received runtime cfg: ${runtimeCfgString}`);

  // Verbose && console.timeEnd(`[Dbux] babel write 1 (stringify) "${filePath}"`);

  // Verbose && console.debug(`[Dbux] babel write size:`, (staticDataString.length / 1000).toFixed(2), 'k');

  // Verbose && console.time(`[Dbux] babel write (AST)`);
  // console.trace('dbuxRuntime', dbuxRuntime);

  // WARNING: "TypeError: `initProgram` is not a function" is a common problem here.
  //    -> that can be due to circular dependencies or other issues breaking `require('@dbux/runtime')`
  //    -> console.warn('dbux_init', dbuxRuntime, typeof __dbux__, require('@dbux/runtime'));
  const result = buildSource(`
function ${dbuxInit.name}(dbuxRuntime) {
  return dbuxRuntime.initProgram(${staticDataString}, ${runtimeCfgString});
}`);
  // Verbose && console.timeEnd(`[Dbux] babel write (AST)`);

  // free up some memory (doesn't make a difference)
  // delete state.contexts;
  // delete state.traces;
  // delete state.loops;
  // const result = buildSource(`"";`);
  return result;
}