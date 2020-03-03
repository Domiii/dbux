import { guessFunctionName } from '../../helpers/functionHelpers';
import { runSnapshotTests } from '../../testing/test-util';
import { buildSource, buildVarDecl, buildVarAssignments } from '../../helpers/builders';
import { replaceProgramBody } from '../../helpers/program';
import * as t from '@babel/types';

const code =`
/**
 * comment
 */
function f() {}
`;

const visited = new Set();

const plugin = function ({ types: t }) {
  return {
    visitor: {
      Function(path, state) {
        const name = guessFunctionName(path, state);
        expect(name).toBe('f');
      }
    }
  };
};


runSnapshotTests(code, __filename, __filename, false, {
  plugin,
  tests: [{
    // assume code to be equal
    snapshot: false,
    output: code
  }]
}, ['esNext']);
