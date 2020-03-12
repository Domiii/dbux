import justRunMyPlugin from '../testing/justRunMyPlugin';
import { getRealVariableNames } from '../helpers/bindingsHelper';

function expectPathBindingNames(path, names) {
  const varNames = getRealVariableNames(path);
  expect(varNames).toIncludeSameMembers(names);
}

/**
 * @see https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings
 */

function run(code, visitor) {
  function plugin() {
    return {
      visitor
    };
  }

  justRunMyPlugin(code, plugin, {
    filename: __filename
  });
}

test('function bindings', () => {
  run(`
function f(x, { a, b: [c] }) { 
  let k = 3;
  console.log(a, c, x, k);
}
`, {
    Function(path, state) {
      const body = path.get('body');
      const params = path.get('params');

      // TODO: need to extract bindings only inside the params

      expectPathBindingNames(body, ['x', 'a', 'c', 'k']);
      expectPathBindingNames(params, ['x', 'a', 'c']);
    }
  });
});

test('for-of bindings', () => {
  run(`
for (const x of [1,2]) {
  console.log(x);
}
`, {
    CallExpression(path, state) {
      const firstArg = path.get('arguments')[0];
      expectPathBindingNames(firstArg, ['x']);
    },

    ForOfStatement(path, state) {
      const body = path.get('body');
      const left = path.get('left');
      
      expectPathBindingNames(body, []);     // empty
      expectPathBindingNames(left, ['x']);

      // console.log('params', Object.keys(params.scope.bindings));
      // expect(name).toBe('f');
    }
  });
});
