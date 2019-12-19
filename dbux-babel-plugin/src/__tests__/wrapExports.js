import { runAllSnapshotTests } from '../testing/test-util';
import { buildVarDecl, buildVarAssignments, buildWrapTryFinally } from '../helpers/builders';
import { replaceProgramBody } from '../helpers/modification';
import { logInternalError } from '../log/logger';
import * as t from '@babel/types';

const codes = [
  `
//export default class A {};
const a=1,b=2,d=3,x=4;
export { a, b };
export class B {};
export const c = 1;
export default d;
//export c from 'x';
export * from 'hi';
`
];

const visited = new Set();


function extractExportNamedVariableDeclaration(path, node, exportIds, newIds, bodyNodes, exportNodes) {
  // variable declaration
  const decls = node.declaration.declarations;
  const nodeExportIds = decls.map(n => n.id);
  exportIds.push(...nodeExportIds);
  const newNodeIds = nodeExportIds.map(id => path.scope.generateUidIdentifier(id.name));
  newIds.push(...newNodeIds);
  exportNodes.push(
    t.exportNamedDeclaration(null,
      nodeExportIds.map((exportId, i) => t.exportSpecifier(newNodeIds[i], exportId))
    )
  );
  bodyNodes.push(node.declaration);   // keep declaration in body
}

function extractExportNamedDeclaration(path, node, exportIds, newIds, bodyNodes, exportNodes) {
  if (node.declaration) {
    const { id } = node.declaration;
    if (t.isVariableDeclaration(node)) {
      extractExportNamedVariableDeclaration(path, node, exportIds, newIds, bodyNodes, exportNodes);
    }
    else if (id) {
      // non-variable declaration
      const newId = path.scope.generateUidIdentifier(id.name);
      exportIds.push(id);
      newIds.push(newId);
      exportNodes.push(
        t.exportNamedDeclaration(null,
          [t.exportSpecifier(newId, id)]
        )
      );
      bodyNodes.push(node.declaration);   // keep declaration in body
    }
    else {
      logInternalError('Cannot understand export node (named export with declaration but without id)', node.toString());
      return;
    }
  }
  else if (node.specifiers) {
    // assign local specifier to new var, then
    // export new var as exported specifier
    const nodeExportIds = node.specifiers.map(spec => spec.local);
    exportIds.push(...nodeExportIds);
    const newNodeIds = nodeExportIds.map(id => path.scope.generateUidIdentifier(id.name));
    newIds.push(...newNodeIds);
    exportNodes.push(
      t.exportNamedDeclaration(null,
        node.specifiers.map((spec, i) => t.exportSpecifier(newNodeIds[i], spec.exported))
      )
    );
  }
  else {
    logInternalError('Cannot understand export node (named export with neither declaration nor specifiers)', node.toString());
  }
}

function extractExportDefaultDeclaration(path, node, exportIds, newIds, bodyNodes, exportNodes) {
  if (node.declaration && node.declaration.id) {
    const { id } = node.declaration;
    const newId = path.scope.generateUidIdentifier(id.name);
    exportIds.push(id);
    newIds.push(newId);
    exportNodes.push(t.exportDefaultDeclaration(id));
    bodyNodes.push(node.declaration);   // keep declaration in body
  }
  else {
    exportNodes.push(node);
  }
}

function extractExportDeclaration(path, node, exportIds, newIds, bodyNodes, exportNodes) {
  if (t.isExportNamedDeclaration(node)) {
    extractExportNamedDeclaration(path, node, exportIds, newIds, bodyNodes, exportNodes);
  }
  else if (t.isExportDefaultDeclaration(node)) {
    extractExportDefaultDeclaration(path, node, exportIds, newIds, bodyNodes, exportNodes);
  }
  else if (!node.declaration) {
    exportNodes.push(node);
  }
  else {
    logInternalError('Cannot understand export node (not named, not default, but has declaration)', node.toString());
  }
}

function programVisitor(path) {
  if (visited.has(path)) return;
  visited.add(path);

  const bodyPaths = path.get('body');
  const exportIds = [];
  const newIds = [];
  const bodyNodes = [];
  const exportNodes = [];
  for (let i = 0; i < bodyPaths.length; ++i) {
    const childPath = bodyPaths[i];
    const { node } = childPath;
    if (!t.isExportDeclaration(node)) {
      bodyNodes.push(node);
    }
    else {
      extractExportDeclaration(path, node, exportIds, newIds, bodyNodes, exportNodes);
    }
  }

  // build assignment statements
  bodyNodes.push(...buildVarAssignments(newIds, exportIds));

  // finally, wrap everything up
  const newNodes = [
    buildVarDecl(newIds),
    ...buildWrapTryFinally(bodyNodes, [], []),
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
