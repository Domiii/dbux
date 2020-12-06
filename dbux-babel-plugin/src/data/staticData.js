import { buildSource } from '../helpers/builders';

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

  // const staticDataString = JSON.stringify(staticData, null, 4);
  const staticDataString = JSON.stringify(staticData);
  const runtimeCfgString = JSON.stringify(runtimeCfg);

  return buildSource(`
function ${dbuxInit}(dbuxRuntime) {
  return dbuxRuntime.initProgram(${staticDataString}, ${runtimeCfgString});
}`);
}