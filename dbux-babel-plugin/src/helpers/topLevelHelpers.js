import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import { buildVarDecl, buildVarAssignments } from '../instrumentation/builders/common';
import { getBindingIdentifierPaths } from './bindingsUtil';
import { pathToString } from './pathHelpers';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('topLevelHelpers');

function extractExportNamedVariableDeclaration(programPath, path, exportIds, newIds, bodyNodes, exportNodes) {
  // variable declaration
  const decls = path.get('declaration.declarations');
  const declIds = decls.flatMap(p => getBindingIdentifierPaths(p));
  // console.debug('exports', declIds.map((p, i) => `(${i + 1}) ${pathToString(p)}`).join(', '));
  const nodeExportIds = declIds.map(p => p.node);
  exportIds.push(...nodeExportIds);
  const newNodeIds = nodeExportIds.map(id => programPath.scope.generateUidIdentifier(id.name));
  newIds.push(...newNodeIds);
  exportNodes.push(
    t.exportNamedDeclaration(null,
      nodeExportIds.map((exportId, i) => t.exportSpecifier(newNodeIds[i], exportId))
    )
  );
  bodyNodes.push(path.node.declaration);   // keep declaration in body
}

function extractExportNamedDeclaration(programPath, path, exportIds, newIds, bodyNodes, exportNodes) {
  const { node } = path;
  if (node.source) {
    // e.g. `export ... from ...`
    exportNodes.push(node);
  }
  else if (node.declaration) {
    // e.g. `export const x = 1;`
    const { id } = node.declaration;
    if (t.isVariableDeclaration(node.declaration)) {
      // variable declaration
      extractExportNamedVariableDeclaration(programPath, path, exportIds, newIds, bodyNodes, exportNodes);
    }
    else if (id) {
      // non-variable declaration
      const newId = programPath.scope.generateUidIdentifier(id.name);
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
      logError('Cannot understand export node (named export with declaration but without id)', node.toString());
    }
  }
  else if (node.specifiers) {
    // e.g.: `export { ... }`
    // assign local specifier to new var, then
    // export new var as exported specifier
    const nodeExportIds = node.specifiers.map(spec => spec.local);
    exportIds.push(...nodeExportIds);
    const newNodeIds = nodeExportIds.map(id => programPath.scope.generateUidIdentifier(id.name));
    newIds.push(...newNodeIds);
    exportNodes.push(
      t.exportNamedDeclaration(null,
        node.specifiers.map((spec, i) => t.exportSpecifier(newNodeIds[i], spec.exported))
      )
    );
  }
  else {
    logError('Cannot understand export node (named export with neither declaration nor specifiers)', node.toString());
  }
}

function extractExportDefaultDeclaration(programPath, path, exportIds, newIds, bodyNodes, exportNodes) {
  const { node } = path;
  if (!node.declaration) {
    logError('cannot understand export default node:', pathToString(path));
    exportNodes.push(node);
  }
  else if (node.declaration.id) {
    // e.g. `export default function f() {}`
    const { id } = node.declaration;
    const newId = programPath.scope.generateUidIdentifier(id.name);
    exportIds.push(id);
    newIds.push(newId);
    exportNodes.push(t.exportDefaultDeclaration(newId));
    bodyNodes.push(node.declaration);   // keep declaration in body
  }
  else if (t.isIdentifier(node.declaration)) {
    // e.g. `export default x`
    const id = node.declaration;
    const newId = programPath.scope.generateUidIdentifier(id.name);
    exportIds.push(id);
    newIds.push(newId);
    exportNodes.push(t.exportDefaultDeclaration(newId));
  }
  else {
    // e.g. `export default f()`
    const newId = programPath.scope.generateUidIdentifier('exp');
    exportNodes.push(t.exportDefaultDeclaration(newId));
    bodyNodes.push(               // assign temp variable in body
      t.variableDeclaration('var', [
        t.variableDeclarator(newId, node.declaration)
      ])
    );
    // bodyNodes.push(               // assign temp variable in body
    //   t.expressionStatement(
    //     t.assignmentExpression('=', newId, node.declaration)
    //   )
    // );
  }
}

function extractExportDeclaration(programPath, path, exportIds, newIds, bodyNodes, exportNodes) {
  // console.warn(`[export] ${path} ${t.isExportNamedDeclaration(node)} ${t.isExportDefaultDeclaration(node)}`);
  if (path.isExportNamedDeclaration()) {
    extractExportNamedDeclaration(programPath, path, exportIds, newIds, bodyNodes, exportNodes);
  }
  else if (path.isExportDefaultDeclaration()) {
    extractExportDefaultDeclaration(programPath, path, exportIds, newIds, bodyNodes, exportNodes);
  }
  else if (!path.node.declaration) {
    exportNodes.push(path.node);
  }
  else {
    logError('Cannot understand export node (not named, not default, but has declaration)', pathToString(path));
  }
}


/**
 * Extract all `import` and `export` statements 
 * from `programPath` body into four groups:
 * 
 * 1. All imports
 * 2. An initial variable declaration statement to (later) store all exports
 * 3. The original body, modified without any exports
 * 4. All export statements
 * 
 * @param {*} programPath 
 */
export function extractTopLevelDeclarations(programPath) {
  const bodyPaths = programPath.get('body');
  const importNodes = [];
  const exportIds = [];
  const newIds = [];
  const bodyNodes = [];
  const exportNodes = [];
  for (let i = 0; i < bodyPaths.length; ++i) {
    const childPath = bodyPaths[i];
    const { node } = childPath;
    if (t.isImportDeclaration(node)) {
      importNodes.push(node);
    }
    else if (t.isExportDeclaration(node)) {
      try {
        extractExportDeclaration(programPath, childPath, exportIds, newIds, bodyNodes, exportNodes);
      }
      catch (err) {
        throw new NestedError(`"extractTopLevelDeclarations" failed for ${pathToString(childPath)}`, err);
      }
    }
    else {
      bodyNodes.push(node);
    }
  }

  // assign export values to temp vars
  bodyNodes.push(...buildVarAssignments(newIds, exportIds));

  // finally, wrap everything up
  return [
    importNodes,
    newIds.length && [buildVarDecl(newIds)] || [],
    bodyNodes,
    exportNodes
  ];
}