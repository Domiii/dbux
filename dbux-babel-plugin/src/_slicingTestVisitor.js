/* eslint-disable no-console */

import { pathToString } from './helpers/pathHelpers';
import { findSuperCallPath } from './visitors/classUtil';

// import injectDbuxState from './dbuxState';
// import { getBinding, getBindingPath } from './helpers/bindingsHelper';
// import nameVisitors from './visitors/nameVisitors';

function loc2s(loc) {
  return `${loc.start.line}:${loc.start.column}`;
}

function binding2s(binding) {
  const p = binding.path.get('id') || binding.path;
  const name = p.toString();
  return `[${binding.path.node.type}] ${name} ${binding.scope.block.type} (${loc2s(binding.path.node.loc)})`;
}


const bindingsStack = [];
const globals = new Set();

// function getOrCreate(map, key, Ctor = Map) {
//   let item = map.get(key);
//   if (!item) {
//     map.set(key, item = new Ctor());
//   }
//   return item;
// }

function addBinding(path, binding) {
  if (binding) {
    bindingsStack[bindingsStack.length - 1].add(binding);
  }
  else {
    globals.add(path.toString());
  }
}

const contextVisitor = {
  enter() {
    bindingsStack.push(new Set());
  },
  exit(path, state) {
    const name = path.node.id?.name || '(anonymous)';
    const bindings = Array.from(bindingsStack.pop());
    console.log(`${name}@${loc2s(path.node.loc)} - referenced bindings:`, [''].concat(
      bindings.map((b) => binding2s(b))
    ).join('\n  '));
  }
};

// function collectAllBindings(path, state) {
//   const visitor = {
//   };
//   path.traverse(visitor, state);
// }

// function Function(path, state) {
//   // TODO: collect all "enclosed" variables
//   const name = path.node.id?.name || '(anonymous)';
//   const bodyPath = path.get('body');
//   // bodyPath.scope.crawl();
//   // const varRefs = Object.values(bodyPath.scope.references);
//   const bindings = new Set(varRefs.map(ref => ref.scope.getBinding(ref.node.name)));
//   console.log(`${name} - referenced bindings:`, [''].concat(
//     Object.entries(bindings)
//       .map(([bindingName, b]) => binding2s(b, bindingName))
//   ).join('\n  '));
// }

// const visitor = {
//   // CallExpression
//   // Program(path, state) {
//   //   // const cfg = state.opts;
//   //   if (state.onEnter) return; // make sure to not visit Program node more than once

//   //   // inject data + methods that we are going to use for instrumentation
//   //   injectDbuxState(path, state);

//   //   // before starting instrumentation, first get raw data from unmodified AST
//   //   const nameVisitorObj = nameVisitors();
//   //   traverse(path, state, nameVisitorObj);
//   // },
//   Program: contextVisitor,
//   Function: contextVisitor,

//   /**
//    * @see https://github.com/babel/babel/blob/672a58660f0b15691c44582f1f3fdcdac0fa0d2f/packages/babel-traverse/src/scope/index.ts#L215
//    */
//   ReferencedIdentifier(path, state) {
//     const binding = path.scope.getBinding(path.node.name);
//     // if (binding) {
//     addBinding(path, binding);
//     // binding.reference(ref);
//     // } else {
//     //   programParent.add Global(ref.node);
//     // }
//   }
//   // Function,
// };

const visitor = {
  ClassMethod(path, state) {
    const superCall = findSuperCallPath(path);
    console.log('[visit]', pathToString(path), ' - SUPER:', superCall && pathToString(superCall));
  }
};

export default visitor;


// ###########################################################################
// other
// ###########################################################################

// function CallExpression(path, state) {
//   const { node } = path;
//   if (node.callee.name !== 'f') {
//     // ignore everything but `f(...)`
//     return;
//   }

//   const varIdPath = path.get('arguments.0');
//   const varId = varIdPath.node;
//   const varName = varId.name;
//   const binding = getBinding(varIdPath);

//   const refs = binding?.referencePaths || [];
//   // const bindingScope = binding.scope;
//   console.log(`[CE] "${varIdPath.toString()}"@${binding2s(binding)}; ${binding?.kind || '(?)'} ${varName}, ${refs.length}):`,
//     [''].concat(
//       refs.
//         // map(p => JSON.stringify(p.node.loc.start.line))
//         map(p => `${loc2s(p.node.loc)}`)
//       || []).join('\n  ')) || '(not found)';
//   // console.log(`  (all bindings in scope ${path.scope.constructor.name}: ${Object.keys(path.scope.bindings)})`);
// }