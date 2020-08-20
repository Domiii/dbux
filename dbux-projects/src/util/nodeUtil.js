import EmptyArray from '@dbux/common/src/util/EmptyArray';

export function buildNodeCommand(cfg) {
  let {
    // cwd,
    nodeArgs = `--stack-trace-limit=1000 --enable-source-maps --nolazy`,
    debugPort,
    require: requireArr = EmptyArray,
    program,
    programArgs,
  } = cfg;

  // NOTE: depending on the mode, NYC uses either of the following:
  //  1. simple 
  //    - node-preload - https://www.npmjs.com/package/node-preload ("Request that Node.js child processes preload modules")
  //    - process-on-spawn - 
  //  2. wrapped
  //    - spawn-wrap - https://github.com/istanbuljs/spawn-wrap ("brutal hack [...] in cases where tests or the system under test are loaded via child processes rather than via require(). [...] any child processes launched by that child process will also be wrapped.")

  const nodeDebugArgs = debugPort && `--inspect-brk=${debugPort}` || '';

  // pre-load some modules
  // const nodeRequireArr = [
  //   ...requireArr.map(r => path.join(cwd, r))
  // ];
  const nodeRequireArr = requireArr;
  const nodeRequireArgs = nodeRequireArr.map(r => `--require="${r}"`).join(' ');

  // final command
  return `node ${nodeArgs} ${nodeDebugArgs} ${nodeRequireArgs} "${program}" ${programArgs}`;
}