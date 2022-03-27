import EmptyArray from '@dbux/common/src/util/EmptyArray';

/**
 * NOTE: uses volta
 */
export function makeNodeAtVersionCommand(version, cmd) {
  // NOTE: there is a weird bug sometimes, where it just will keep saying "volta not found"...
  const volta = 'volta';
  this.exec(`which ${volta}`); // make sure, volta exists
  return `"${volta}" run --node ${version} node ${cmd}`;
}

export function buildNodeCommand(cfg) {
  let {
    // cwd,
    nodePath = 'node',
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
  return `"${nodePath}" ${nodeArgs} ${nodeDebugArgs} ${nodeRequireArgs} "${program}" ${programArgs}`;
}