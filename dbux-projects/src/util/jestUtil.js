import path from 'path';
import { buildNodeCommand } from './nodeUtil';

/**
 * @see https://stackoverflow.com/questions/42827054/how-do-i-run-a-single-test-using-jest
 */
export async function buildJestRunBugCommand(cwd, jestArgs, requireArr, debugPort = 9309) {
  const program = `${cwd}/node_modules/jest/bin/jest.js`;

  // const transform = `{
  //     "^.+\\.jsx?$": ["babel-jest"]
  //   }`;
  jestArgs = `${jestArgs} --cache=false`;
  // --transform=${transform}`;
  // --cache=false

  // final command
  return buildNodeCommand({
    cwd,
    debugPort,
    program,
    require: requireArr,
    programArgs: `${jestArgs}`
  });
}