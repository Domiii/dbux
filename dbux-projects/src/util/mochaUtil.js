import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { buildNodeCommand } from './nodeUtil';

export async function buildMochaRunCommand(cfg) {
  let {
    cwd,
    testArgs = '-c', // colors
    keepAlive = true,
    require = EmptyArray,
    ...moreCfg
  } = cfg;

  // keep alive: if we don't do this, mocha will call `process.exit` when run has ended, and we won't receive data sent by runtime
  const noExit = keepAlive ? '--no-exit ' : '';

  testArgs = `${noExit}${testArgs}`;

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
  //   programArgs: `${keepAlive} ${testArgs}`
  // });

  const program = `${cwd}/node_modules/mocha/bin/_mocha`;
  const programArgs = testArgs;

  return buildNodeCommand({
    ...moreCfg,
    require,
    program,
    programArgs
  });
}