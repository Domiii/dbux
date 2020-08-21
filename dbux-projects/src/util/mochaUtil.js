import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { getDbuxModulePath } from '@dbux/common/src/dbuxPaths';
import { buildNodeCommand } from './nodeUtil';

export async function buildMochaRunCommand(cfg) {
  const {
    cwd, 
    mochaArgs,
    nodeArgs,
    require = EmptyArray,
    debugPort
  } = cfg;
  
  const program = `${cwd}/node_modules/mocha/bin/_mocha`;

  // NOTE: `Project.installDbuxDependencies` installs @dbux/cli for us
  const initScript = getDbuxModulePath('cli', 'lib/dbux-register.js');
  // const initScript = `./_dbux_inject.js`;

  // keep alive: if we don't do this, mocha will call `process.exit` when run has ended, and we won't receive data sent by runtime
  const keepAlive = '--no-exit';

  // final command
  return buildNodeCommand({
    cwd,
    nodeArgs,
    debugPort,
    program,
    require: [
      initScript,
      ...require
    ],
    programArgs: `${keepAlive} ${mochaArgs}`
  });
}