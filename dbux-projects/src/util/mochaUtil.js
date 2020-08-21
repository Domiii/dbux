import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { getDbuxModulePath } from '@dbux/common/src/dbuxPaths';
import { buildNodeCommand } from './nodeUtil';

export async function buildMochaRunBugCommand(cwd, mochaArgs, requireArr = EmptyArray, debugPort = 9309) {
  const program = `${cwd}/node_modules/mocha/bin/_mocha`;

  // NOTE: `Project.installDbuxDependencies` installs @dbux/cli for us
  const initScript = getDbuxModulePath('cli', 'lib/dbux-register.js');
  // const initScript = `./_dbux_inject.js`;

  // keep alive: if we don't do this, mocha will call `process.exit` when run has ended, and we won't receive data sent by runtime
  const keepAlive = '--no-exit';

  // final command
  return buildNodeCommand({
    cwd,
    debugPort,
    program,
    require: [
      initScript,
      ...requireArr
    ],
    programArgs: `${keepAlive} ${mochaArgs}`
  });
}