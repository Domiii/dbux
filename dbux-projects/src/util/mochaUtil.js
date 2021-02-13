import path from 'path';
import fs from 'fs';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { getDbuxModulePath } from '@dbux/common/src/dbuxPaths';
import { buildNodeCommand } from './nodeUtil';

export async function buildMochaRunCommand(cfg) {
  let {
    cwd, 
    dbuxJs,
    mochaArgs = '-c', // colors
    keepAlive = true,
    nodeArgs,
    dbuxArgs,
    require = EmptyArray,
    debugPort
  } = cfg;

  // keep alive: if we don't do this, mocha will call `process.exit` when run has ended, and we won't receive data sent by runtime
  const noExit = keepAlive ? '--no-exit ' : '';

  mochaArgs = `${noExit}${mochaArgs}`;
  
  // NOTE: `Project.installDbuxDependencies` installs @dbux/cli for us

  // const mochaJs = `${cwd}/node_modules/mocha/bin/_mocha`;
  // const initScript = getDbuxModulePath('cli', 'lib/dbux-register.js');
  // require = [
  //   initScript,
  //   ...require
  // ];
  // return buildNodeCommand({
  //   cwd,
  //   nodeArgs,
  //   debugPort,
  //   program: mochaJs,
  //   require,
  //   programArgs: `${keepAlive} ${mochaArgs}`
  // });

  const mochaJs = `${cwd}/node_modules/mocha/bin/_mocha`;
  let program;
  let programArgs;
  if (dbuxJs) {
    program = dbuxJs;
    programArgs = `run ${dbuxArgs} "${mochaJs}" -- ${mochaArgs}`;
  }
  else {
    program = mochaJs;
    programArgs = mochaArgs;
  }
  
  return buildNodeCommand({
    cwd,
    nodeArgs,
    debugPort,
    require,
    program,
    programArgs
  });
}