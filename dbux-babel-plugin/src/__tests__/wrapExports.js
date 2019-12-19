import { runAllSnapshotTests } from '../testing/test-util';
import { buildSource, buildVarDecl, buildVarAssignments, buildWrapTryFinally, buildNamedExport } from '../helpers/builders';
import { replaceProgramBody } from '../helpers/modification';
import { logInternalError } from '../log/logger';
import * as t from '@babel/types';

const codes = [
  `
//export default class A {};
var a=1,b=2,d=3,x=4;
export { a, b };
export class B {};
export const c = 1;
export default d;
//export c from 'x';
export * from 'hi';
`
];

const visited = new Set();

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
    else if (t.isExportNamedDeclaration(node)) {
      if (node.declaration) {
        const { id } = node.declaration;
        if (t.isVariableDeclaration(node)) {
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
            node.specifiers.map((spec) => t.exportSpecifier(newNodeIds[i], spec.exported))
          )
        );
      }
      else {
        logInternalError('Cannot understand export node (named export with neither declaration nor specifiers)', node.toString());
      }
    }
    else if (t.isExportDefaultDeclaration(node)) {
      if (node.declaration && node.declaration.id) {
        const { id } = node.declaration;
        const newId = path.scope.generateUidIdentifier(id.name);
        exportIds.push(id);
        newIds.push(newId);
        // TODO
        // else if (t.isExportDefaultDeclaration(node)) {
        //   exportNodes.push(t.exportDefaultDeclaration(id));
        //   bodyNodes.push(node.declaration);   // keep declaration in body
        // }
        // else {
        //   logError('Found unknown export declaration, moving as-is:', node.toString());
        //   exportNodes.push(node);
        // }
      }
      else {
        exportNodes.push(node);
      }
    }
    else {
      exportNodes.push(node);
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
