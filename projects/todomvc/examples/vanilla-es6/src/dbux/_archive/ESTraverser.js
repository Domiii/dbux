// import { arraysEqual } from '../core/util';
// import * as estraverse from 'estraverse';

// // #######################################################################################
// // ESTraverser
// // #######################################################################################

// export default class ESTraverser {
//   _stack;

//   // #####################################
//   // init
//   // #####################################

//   constructor(cfg) {
//     Object.assign(this, cfg);
//   }

//   _buildTraverseHandler() {
//     const stack = this._stack = [];
//     const traverser = this;
//     return {
//       enter(node, parent) {
//         // using estraverse s.t. we can access the entire stack, and also know each node's key (name of sub tree)
//         // see: https://github.com/estools/estraverse/blob/master/estraverse.js#L330
//         const { ref } = this.__current;
//         const enhancedRef = ref;
//         enhancedRef.node = node;
//         stack.push(enhancedRef);

//         traverser.enter(enhancedRef, traverser.getStackRef);
//       },
//       leave(node, visitor) {
//         traverser.leave(traverser.getStackRef(0), traverser.getStackRef);
//         stack.pop();
//       }
//     };
//   }

//   // #####################################
//   // Getters + properties
//   // #####################################

//   get currentRef() {
//     return this.getStackRef(0);
//   }

//   getStackRef = (i) => {
//     const stack = this._stack;
//     return stack[stack.length - i - 1];
//   }


//   // #####################################
//   // AST node classifications
//   // #####################################

//   /**
//    * E.g.: `a` in `{ a: 1 }`
//    * NOTE: `computed = true` would be `{ [a]: 1 }`
//    */
//   isNonComputedProperty() {
//     const { node } = this.getStackRef(1);
//     return node.type === 'Property' && !node.computed;
//   }

//   /**
//    * Right-most node of left-hand side in assignment.
//    * E.g.: `z` in `x.y.z = 1;`
//    */
//   isRightMostAssignmentLHS() {
//     const s = [0, 1].map(i => this.getStackRef(i).key);
//     return arraysEqual(s, ['left', 'expression']);
//   }

//   /**
//    * Left-hand side 
//    */
//   isAssignmentLValue() {
//     const [ref, parentRef] = [0, 1].map(i => this.getStackRef(i));
//     return ref.key === 'id' && parentRef.node.type === 'VariableDeclarator';
//   }

//   // #####################################
//   // traversal + more
//   // #####################################

//   replace(ast) {
//     return estraverse.replace(ast, this._buildTraverseHandler());
//   }

//   enter({ node, key, parent }, getStackRef) {
//     // console.log([node.type, parent.type]);
//     // ref.replace(instrumentNode(node));
//   }

//   leave() { }
// }
