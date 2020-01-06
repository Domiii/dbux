import { runSnapshotTests, runAllSnapshotTests } from '../../testing/test-util';
import { buildSource } from '../../helpers/builders';

const codes = [
  `
function f2() {
  AddCustomCode();
  AddCustomCode();
}
f2();
f2();
`
// ,
//   `
// function f1() {
//   console.log('hi');
// }

// f1();
// `
];

const plugin = function ({ types: t }) {
  const customCode = buildSource(`someFancyCodeHere();`);

  let imported = false;
  let root;
  return {
    visitor: {
      Program(path) {
        root = path;
      },
      CallExpression(path) {
        if (!imported && path.node.callee.name === "AddCustomCode") {
          // add import if it's not there
          imported = true;
          root.unshiftContainer('body', customCode);
          root.resync();
        }
      }
    }
  };
};


runAllSnapshotTests(codes, __filename, plugin, false);
