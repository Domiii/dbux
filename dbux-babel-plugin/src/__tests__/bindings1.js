import { guessFunctionName } from '../helpers/functionHelpers';
import { runSnapshotTests } from '../testing/test-util';
import { buildSource, buildVarDecl, buildVarAssignments } from '../helpers/builders';
import { replaceProgramBody } from '../helpers/program';
import * as t from '@babel/types';
import justRunMyPlugin from '../testing/justRunMyPlugin';

/**
 * @see https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings
 */
const code = `
function f(x, { a, b: [c] }) { 
  let k = 3;
  console.log(a, c, x, k);
}
`;


test('', () => {
  const visited = new Set();

  let path;

  const plugin = function ({ types: t }) {
    return {
      visitor: {
        Function(_path, state) {
          path = _path;
        }
      }
    };
  };

  justRunMyPlugin(code, plugin, {
    filename: __filename
  });

  const block = path.get('body');
  const params = path.get('params');
  const { bindings } = block.scope;
  console.log('body', Object.keys(bindings));
  // console.log('params', Object.keys(params.scope.bindings));
  // expect(name).toBe('f');
});
