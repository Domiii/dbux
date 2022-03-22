import isPlainObject from 'lodash/isPlainObject';
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
    // fileName,
    // filePath,
    /**
     * Move the Program (first) context out of the `contexts` array to top-level.
     */
    program: contexts._all[0] || null,

    contexts: contexts._all,
    traces: traces._all,
    loops: loops._all
  };

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

  // Verbose > 3 && console.debug(`Received runtime cfg: ${runtimeCfgString}`);
  // Verbose && console.debug(`[Dbux] babel write size:`, (staticDataString.length / 1000).toFixed(2), 'k');
  // Verbose && console.time(`[Dbux] babel write (AST)`);

  // // const staticDataString = JSON.stringify(staticData, null, 2);
  const staticDataString = JSON.stringify(staticData);

  // WARNING: "TypeError: `initProgram` is not a function" is a common problem here.
  //    -> that is usually due to circular dependencies or other issues breaking `require('@dbux/runtime')`
  const result = buildSource(`
function ${dbuxInit.name}(dbuxRuntime) {
  if (dbuxRuntime.initProgram) {
    throw new Error('Dbux failed to initialize in "${fileName}"');
  }
  return dbuxRuntime.initProgram(${staticDataString}, ${runtimeCfgString});
}`);
  // Verbose && console.timeEnd(`[Dbux] babel write (AST)`);
  return result;
}