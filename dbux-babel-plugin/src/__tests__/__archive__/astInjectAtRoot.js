import { NodePath } from '@babel/traverse';
import { runSnapshotTests, runAllSnapshotTests } from '../../testing/test-util';
import { buildSource } from '../../instrumentation/builders/common';

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
  /**
   * @type {NodePath}
   */
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
          // NOTE: resync fixes up all properties of the node in relation to its parent.
          // root.resync();
        }
      }
    }
  };
};


runAllSnapshotTests(codes, __filename, plugin, false);
