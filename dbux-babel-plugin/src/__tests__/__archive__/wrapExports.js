import { runAllSnapshotTests } from '../../testing/test-util';
import { replaceProgramBody } from '../../helpers/program';
import { buildWrapTryFinally } from '../../helpers/builders';
import { extractTopLevelDeclarations } from '../../helpers/topLevelHelpers';

const codes = [
  `
//export default class A {};
import asd from 'file1';
const a=1,b=2;
export { a, b };
export class B {};
export const c = 1;

const d=3,x=4;
export default d;
//export c from 'x';
export { x as exportedX };
export * from 'file2';
`
];

const visited = new Set();


function programVisitor(path) {
  if (visited.has(path)) return;
  visited.add(path);

  const [
    importNodes,
    initVarDecl,
    bodyNodes,
    exportNodes
  ] = extractTopLevelDeclarations(path);

  const newNodes = [
    ...importNodes,
    ...initVarDecl,
    buildWrapTryFinally(bodyNodes, []),
    ...exportNodes
  ];
  replaceProgramBody(path, newNodes);
}


const plugin = function () {
  return {
    visitor: {
      Program: programVisitor
    }
  };
};


runAllSnapshotTests(codes, __filename, plugin, true);
