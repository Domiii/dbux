import programVisitor from './visitors/programVisitor';
import '@dbux/common/src/util/prettyLogs';
// import { logInternalError } from './log/logger';

/**
 * The Dbux Babel plugin.
 * 
 * NOTE: The config is also available via state.opts (see `dbuxState.js`).
 */
export default function dbuxBabelPlugin(_, cfg) {
  return {
    visitor: ({
      Program: programVisitor()
      //   AssignmentExpression(path, state) {
      //     const idName = path.node.left.name;
      //     // VariableDeclarator(path, state) {
      //     //   const idName = path.node.id.name;
      //     const binding = path.scope.bindings[idName];
      //     const refs = binding?.referencePaths || [];
      //     console.log(`[AE] "${path.toString()}" (${binding?.kind || '(?)'} ${idName}, ${refs.length}):`,
      //       [''].concat(
      //         refs.
      //           map(p => JSON.stringify(p.node.loc))
      //         || []).join('\n  ')) || '(not found)';
      //     console.log(`  (all bindings: ${Object.keys(path.scope.bindings)})`);
      //   }


    }),

    // see: https://github.com/babel/babel/blob/9808d2566e6a2b2d9e4c7890d8efbc9af180c683/packages/babel-core/src/transformation/index.js#L115
    // post(file) {
    //   console.log('post');
    //   // setTimeout(() => {
    //   //   delete file.ast;
    //   // }, 100);
    // }
  };
}