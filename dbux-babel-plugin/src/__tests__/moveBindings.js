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
        for (let i = 0; i < nodes.length; ++i) {
          const node = nodes[i];
          const decls = node.declarations;
          if (decls) {
            nodes.splice(i--, 1);  // remove
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
