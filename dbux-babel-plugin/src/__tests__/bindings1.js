import { guessFunctionName } from '../helpers/functionHelpers';
import { runSnapshotTests } from '../testing/test-util';
import { buildSource, buildVarDecl, buildVarAssignments } from '../helpers/builders';
import { replaceProgramBody } from '../helpers/program';
import * as t from '@babel/types';
import justRunMyPlugin from '../testing/justRunMyPlugin';

/**
 * @see https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings
 */

function run(code) {
  const output = {};

  function plugin() {
    return {
      visitor: {
        Function(path, state) {
          output.functionPath = path;
        },
        ForOfStatement(path, state) {
          output.forOfPath = path;
        }
      }
    };
  }

  justRunMyPlugin(code, plugin, {
    filename: __filename
  });

  return output;
}


test('function bindings', () => {
  const { functionPath } = run(`
function f(x, { a, b: [c] }) { 
  let k = 3;
  console.log(a, c, x, k);
}
`);
  const block = functionPath.get('body');
  const params = functionPath.get('params');
  const { bindings } = block.scope;
  
  expect(bindings).toIncludeSameMembers(['x', 'a', 'c', 'k']);
  console.log('function bindings', Object.keys(bindings));
});

test('for-of bindings', () => {
  const { forOfPath } = run(`
for (const x of [1,2]) {
  console.log(x);
}
`);

  const block = forOfPath.get('body');
  const params = forOfPath.get('params');
  const { bindings } = block.scope;

  expect(bindings).toIncludeSameMembers(['x']);
  console.log('for of bindings', Object.keys(bindings));

  // console.log('params', Object.keys(params.scope.bindings));
  // expect(name).toBe('f');
});
