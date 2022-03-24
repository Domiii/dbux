import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { buildNodeCommand } from './nodeUtil';

/**
 * @see https://stackoverflow.com/questions/42827054/how-do-i-run-a-single-test-using-jest
 */
export async function buildJestRunBugCommand(cfg) {
  let {
    cwd,
    dbuxJs,
    dbuxArgs,
    testArgs = '',
    // keepAlive = true, // TODO: keep alive
    require = EmptyArray,
    ...moreCfg
  } = cfg;

  const jestJs = `${cwd}/node_modules/jest/bin/jest.js`;

  // const transform = `{
  //     "^.+\\.jsx?$": ["babel-jest"]
  //   }`;
  // testArgs = `${testArgs} --cache=false`;
  // --transform=${transform}`;

  // final command

  let program;
  let programArgs;
  if (dbuxJs) {
    program = dbuxJs;
    programArgs = `run ${dbuxArgs} "${jestJs}" -- ${testArgs}`;
  }
  else {
    program = jestJs;
    programArgs = testArgs;
  }

  return buildNodeCommand({
    ...moreCfg,
    require,
    program,
    programArgs
  });
}