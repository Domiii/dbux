const isEqual = require('lodash/isEqual');
const truncate = require('lodash/truncate');

function obj2String(obj) {
  if (obj === undefined) {
    return 'undefined';
  }
  const MaxLength = 120;
  return truncate(
    JSON.stringify(obj)
      ?.replace(/\s+/g, ' '),
    { length: MaxLength }
  );
}

module.exports = function runTests(f, tests) {
  /** ########################################
   * run tests
   * #######################################*/
  const results = tests.map(([inputs, expected]) => {
    const actual = f(...inputs);
    return {
      passed: isEqual(actual, expected),
      inputs,

      actual,
      expected
    };
  });

  /** ########################################
   * render results
   * #######################################*/
  const resultString = '  ' + results.map(({ passed, inputs, actual, expected }, i) => {
    const num = i.toString().padEnd(2, ' ');
    let msg;
    if (passed) {
      msg = `Test ${num} PASSED ✔️`;
    }
    else {
      msg = `Test ${num} FAILED ❌`;
    }
    return `${msg}\n` +
      `      inputs: [${inputs.map(obj2String)}]\n` +
      `      actual: ${obj2String(actual)}\n` +
      `    expected: ${obj2String(expected)}`;
  }).join('\n  ');

  /** ########################################
   * report
   * #######################################*/
  if (results.some(res => !res.passed)) {
    console.error(`FAILURE. Not all tests passed:\n${resultString}`);
  }
  else {
    console.log(`SUCCESS! All tests passed:\n${resultString}`);
  }
}