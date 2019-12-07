import { parseSource } from '../helpers/types';
import { runSnapshotTest } from '../testing/test-util';

const codes = [
`function f1() {
  console.log('hi');
}

f1();
`,

`function f2() {
  AddMyImport();
  AddMyImport();
}
f2();
f2();
`
];

const plugin = function ({ types: t }) {
  const importDeclaration = parseSource(`var some = fance.code.here;`);

  let imported = false;
  let root;
  return {
    visitor: {
      Program(path) {
        root = path;
      },
      CallExpression(path) {
        if (!imported && path.node.callee.name === "AddMyImport") {
          // add import if it's not there
          imported = true;
          root.unshiftContainer('body', importDeclaration);
        }
      }
    }
  };
};

codes.forEach((code, i) => 
  runSnapshotTest(code, __filename, `${__filename}[${i}]`, {
    plugin
  })
);
