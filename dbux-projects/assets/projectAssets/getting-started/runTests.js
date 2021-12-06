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
    let actual;
    let error;
    try {
      actual = f(...inputs);
    }
    catch (caught) {
      error = caught;
    }
    return {
      passed: isEqual(actual, expected),
      inputs,

      actual,
      expected,
      error
    };
  });

  /** ########################################
   * render results
   * #######################################*/
  const resultString = '  ' + results.map(({ passed, inputs, actual, expected, error }, i) => {
    const num = i.toString().padEnd(2, ' ');
    let msg;
    if (passed) {
      msg = `Test ${num} PASSED ✔️`;
    }
    else {
      msg = `Test ${num} FAILED ❌`;
    }
    return `${msg}` +
      `\n      inputs: [${inputs.map(obj2String)}]` +
      `\n    expected: ${obj2String(expected)}` +
      (error ?
        `\n       error: ${error.stack}` :
        `\n      actual: ${obj2String(actual)}`
      );
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
};
