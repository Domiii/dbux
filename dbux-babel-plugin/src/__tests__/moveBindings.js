import { runAllSnapshotTests } from '../testing/test-util';
import { buildSource, buildVarDecl, buildVarAssignments } from '../helpers/builders';
import { replaceProgramBody } from '../helpers/modification';
import * as t from '@babel/types';

const codes = [
  `
{
  var a = 1;
  const b = 2;
  let c = 3;
}
`,
`
var a,b,d,x;

//export default class A {};
export { a, b };
export class B {};
export const c = 1;
export default d;
//export c from 'x';
export * from 'hi';
`
];

const visited = new Set();

const plugin = function ({ types: t }) {
  return {
    visitor: {
      Program(path) {
        if (visited.has(path)) return;
        visited.add(path);

        const bodyPath = path.get('body');
        const nodes = bodyPath[0].get('body').map(path => path.node);
        const ids = [];
        const inits = [];
        for (let i = nodes.length-1; i >= 0; --i) {
          const node = nodes[i];
          const decls = node.declarations;
          if (decls) {
            nodes.splice(i, 1);  // remove
            ids.push(...decls.map(n => n.id));
            inits.push(...decls.map(n => n.init));
          }
        }

        const newNodes = [
          buildVarDecl(ids),
          t.blockStatement(buildVarAssignments(ids, inits))
        ];

        replaceProgramBody(path, newNodes);
      }
    }
  };
};


runAllSnapshotTests(codes, __filename, plugin, true);
