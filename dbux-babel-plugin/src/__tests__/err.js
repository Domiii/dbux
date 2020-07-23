import template from '@babel/template';
import { runAllSnapshotTests } from '../testing/test-util';

const codes = [
  `
function f() {
  console.log(1);
  throw new Error('errrrrror');
  console.log(2);
}

f();
`
];

const visited = new Set();

const errHandlerTemplate = template(`
console.log(err);
throw err;
`);


const plugin = function ({ types: t }) {
  return {
    visitor: {
      Function(path) {
        if (visited.has(path)) return;
        visited.add(path);

        const body = path.get('body');
        body.replaceWith(t.blockStatement([
          t.tryStatement(body.node,
            t.catchClause(
              t.identifier('err'),
              t.blockStatement(errHandlerTemplate({
              }))
            ),
            null)
        ]));
      }
    }
  };
};


runAllSnapshotTests(codes, __filename, plugin, true);
