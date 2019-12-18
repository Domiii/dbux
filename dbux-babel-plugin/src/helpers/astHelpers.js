/**
 * For reference, much of AST manipulation is based on babel-types:
 *   Source: https://github.com/babel/babel/tree/master/packages/babel-types
 *   Node classifications: https://github.com/babel/babel/tree/master/packages/babel-types/src/validators/generated/index.js
 *   Docs: https://babeljs.io/docs/en/babel-types
 *   ASTExplorer.net: https://astexplorer.net/
 */

import groupBy from 'lodash/groupBy';
import * as t from '@babel/types';
import { buildSource } from './builders';


/**
 * Might return null if given node has no ids (e.g. anonymous function declaration)
 */
export function getAllIdsOfDeclaration(node) {
  if (node.declaration.declarations) {
    // special case: variable declarations
    //  see: https://babeljs.io/docs/en/babel-types#variabledeclaration
    return node.declaration.declarations.map(n => n.id);
  }
  return node.declaration.id && [node.declaration.id] || null;
}

/**
 * For safety reasons, we always want to wrap all our code in try/finally.
 * However, top-level nodes cannot be wrapped, so we need to extract them.
`... export { a }` -> `var a; ... a = ... export { a }`
 * 
 * Export statement examples:
```
var a,b;

export default x;
//export default class A {};
export const c = 1;
export class B {};
export { a, b };
//export c from 'x';
export * from 'hi';
```
 */
export function extractTopLevelNodes(path, nodes) {
  const { imports, nonImports } = groupBy(nodes, node => {
    if (t.isImportDeclaration(node)) {
      return 'imports';
    }
    return 'nonImports';
  });

  const newVars = [];
  const exportNodes = [];
  for (let i = nonImports.length-1; i >= 0; --i) {
    const node = nonImports[i];
    if (t.isExportDeclaration(node)) {
      let extractedIds;
      if (node.declaration && t.isDeclaration(node.declaration) && 
        (extractedIds = getAllIdsOfDeclaration(node.declaration))) {
        // non-trivial declaration in export statement => extract
        nonImports[i] = node.declaration;
        for (const id of extractedIds) {
          const newVar = path.scope.generateUid();
          const newAss = buildSource(`var `);
        }
        nonImports.splice(i+1, 0, );
      }
      else {
        // can safely remove node from context
        nonImports.splice(i, 1);
        exportNodes.push(i);
      }
    }
  }


  return [imports, nonImports, exportNodes];
}