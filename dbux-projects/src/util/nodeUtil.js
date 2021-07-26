import EmptyArray from '@dbux/common/src/util/EmptyArray';

export function buildNodeCommand(cfg) {
  let {
    // cwd,
    nodeArgs = '',
    require: req = EmptyArray,
    program,
    programArgs = '',
    
    debugPort,
    dbuxJs,
    dbuxArgs,
  } = cfg;

  if (dbuxJs) {
    programArgs = `run ${dbuxArgs} "${program}" -- ${programArgs}`;
    program = dbuxJs;
  }
  // else {
  //   program = program;
  //   programArgs = programArgs;
  // }


  // NOTE: depending on the mode, NYC uses either of the following:
  //  1. simple 
  //    - node-preload - https://www.npmjs.com/package/node-preload ("Request that Node.js child processes preload modules")
  //    - process-on-spawn - 
  //  2. wrapped
  //    - spawn-wrap - https://github.com/istanbuljs/spawn-wrap ("brutal hack [...] in cases where tests or the system under test are loaded via child processes rather than via require(). [...] any child processes launched by that child process will also be wrapped.")

  // const nodeDebugArgs = debugPort && `--inspect-brk=${debugPort}` || '';
  const nodeDebugArgs = debugPort && `--inspect-brk` || '';

  // pre-load some modules
  // requireArr = [
  //   ...requireArr.map(r => path.join(cwd, r))
  // ];
  if (req && !Array.isArray(req)) {
    req = [req];
  }
  const nodeRequireArgs = req.map(r => `--require "${r}"`).join(' ');

  // final command
  return `node ${nodeArgs} ${nodeDebugArgs} ${nodeRequireArgs} "${program}" ${programArgs}`;
}