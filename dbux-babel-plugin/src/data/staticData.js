import { buildSource } from '../helpers/builders';

// const Verbose = false;
const Verbose = true;

export function buildDbuxInit(state) {
  const {
    ids,
    fileName,
    filePath,
    contexts,
    traces,
    varAccess,
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
    varAccess: varAccess._all,
    loops: loops._all
  };

  // // const staticDataString = JSON.stringify(staticData, null, 4);
  // Verbose && console.time(`[Dbux] babel write 1 (stringify) "${filePath}"`);
  const staticDataString = JSON.stringify(staticData);
  const runtimeCfgString = JSON.stringify(runtimeCfg);
  // Verbose && console.timeEnd(`[Dbux] babel write 1 (stringify) "${filePath}"`);

  // Verbose && console.debug(`[Dbux] babel write size:`, (staticDataString.length / 1000).toFixed(2), 'k');

  // Verbose && console.time(`[Dbux] babel write (AST)`);
  const result = buildSource(`
function ${dbuxInit}(dbuxRuntime) {
  return dbuxRuntime.initProgram(${staticDataString}, ${runtimeCfgString});
}`);
  // Verbose && console.timeEnd(`[Dbux] babel write (AST)`);

  // free up some memory (doesn't make a difference)
  // delete state.contexts;
  // delete state.traces;
  // delete state.varAccess;
  // delete state.loops;
  // const result = buildSource(`"";`);
  return result;
}