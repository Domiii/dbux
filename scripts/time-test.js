/**
 * Used to determine differences in speed between `eval` and `new Function(...)`,
 * also in differences between different callers.
 * 
 * Some results:
 * * baseline execution of the code takes about 1s (n = 1e9)
 * * in Chrome all test cases: same
 * * `new Function(...)` on Node: same
 * * `eval(iife)` on Node: 3x slower (3s)
 * * `eval(code)` on Node: 10x slower (10s)
 * * running in VSCode terminal (interactive or non-interactive): same as Node
 * 
 * @example node scripts/time-test.js spawn-child
 * 
 * @file
 */

/* eslint-disable */

if (process.argv[2] === 'spawn-child') {
  // spawn child instead
  const path = require('path');
  const sh = require('shelljs');

  function run(command) {
    const cwd = path.resolve(path.join(__dirname, '..'));
    console.log(` ${cwd}$ ${command}`);
    const result = sh.exec(command, { cwd, silent: true });
    if (result.stdout) {
      console.debug('', result.stdout);
    }
    if (result.stderr) {
      console.error('', result.stderr);
    }

    if (result.code) {
      throw new Error(`Command "${command}" failed, exit status: ${result.code}`);
    }

    return result.stdout.trim();
  }

  run(`node ${__filename} test`);
}
else {
  const codeBody = `
  const N = 1e9;
  let result = 3;
  console.time('time-test');
  for (let i = 0; i < N; ++i) {
    result += Math.sqrt(27);
  }
  console.timeEnd('time-test');
  console.log(result);
  `;

  const code = /* js */`
  () => {
    ${codeBody}
  }
  `;

  // const f = eval(code);
  // f();

  const g = new Function(codeBody);
  g();
}