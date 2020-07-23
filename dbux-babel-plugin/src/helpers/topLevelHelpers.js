import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import { buildVarDecl, buildVarAssignments } from './builders';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('topLevelHelpers');

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
    if (t.isVariableDeclaration(node.declaration)) {
      // variable declaration
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
      logError('Cannot understand export node (named export with declaration but without id)', node.toString());
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
    logError('Cannot understand export node (named export with neither declaration nor specifiers)', node.toString());
  }
}

function extractExportDefaultDeclaration(path, node, exportIds, newIds, bodyNodes, exportNodes) {
  if (!node.declaration) {
    logError('cannot understand export default node', node.toString());
    exportNodes.push(node);
  }
  else if (node.declaration.id) {
    const { id } = node.declaration;
    const newId = path.scope.generateUidIdentifier(id.name);
    exportIds.push(id);
    newIds.push(newId);
    exportNodes.push(t.exportDefaultDeclaration(newId));
    bodyNodes.push(node.declaration);   // keep declaration in body
  }
  else if (t.isIdentifier(node.declaration)) {
    const id = node.declaration;
    const newId = path.scope.generateUidIdentifier(id.name);
    exportIds.push(id);
    newIds.push(newId);
    exportNodes.push(t.exportDefaultDeclaration(newId));
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
    logError('Cannot understand export node (not named, not default, but has declaration)', node.toString());
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
      extractExportDeclaration(programPath, node, exportIds, newIds, bodyNodes, exportNodes);
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