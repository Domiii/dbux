import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';
import { __dbgs_logObjectTrace, trackObject } from './trackObject';

const { Identifier, CallExpression, Syntax } = esprima;

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// see: https://esprima.org/demo/parse.html
// see: https://github.com/jquery/esprima/tree/master/src/syntax.ts

function instrumentNode(origNode) {
  // __dbgs_logObjectTrace(x);
  // return x;
  const ast = esprima.parseScript('__dbgs_logObjectTrace(1)');
  const newNode = ast.body[0].expression;

  console.assert(newNode.type === 'CallExpression');

  // replace first argument with origNode
  newNode.arguments[0] = origNode;

  // console.log(JSON.stringify(newNode, null, 2));
  return newNode;
}

export const identifierIgnoredParents = new Set([
  'VariableDeclarator',
  'FunctionDeclaration'
]);

// #######################################################################################
// ESTraverser
// #######################################################################################

export class ESTraverser {
  _stack;

  // #####################################
  // init
  // #####################################

  constructor(cfg) {
    Object.assign(this, cfg);
  }

  _buildTraverseHandler() {
    const stack = this._stack = [];
    const traverser = this;
    return {
      enter(node, parent) {
        // using estraverse s.t. we can access the entire stack, and also know each node's key (name of sub tree)
        // see: https://github.com/estools/estraverse/blob/master/estraverse.js#L330
        const { ref } = this.__current;
        const enhancedRef = ref;
        enhancedRef.node = node;
        stack.push(enhancedRef);

        traverser.enter(enhancedRef, traverser.getStackRef);
      },
      leave(node, visitor) {
        traverser.leave(traverser.getStackRef(0), traverser.getStackRef);
        stack.pop();
      }
    };
  }

  // #####################################
  // Getters + properties
  // #####################################

  get currentRef() {
    return this.getStackRef(0);
  }

  getStackRef = (i) => {
    const stack = this._stack;
    return stack[stack.length - i - 1];
  }


  // #####################################
  // AST node classifications
  // #####################################

  /**
   * E.g.: `a` in `{ a: 1 }`
   * NOTE: `computed = true` would be `{ [a]: 1 }`
   */
  isNonComputedProperty() {
    const { node } = this.currentRef;
    return node.type === 'Property' && !node.computed;
  }

  /**
   * Right-most node of left-hand side in assignment.
   * E.g.: `z` in `x.y.z = 1;`
   */
  isRightMostAssignmentLHS() {
    const s = [0, 1].map(i => this.getStackRef(i).key);
    return arraysEqual(s, ['left', 'expression']);
  }

  // #####################################
  // traversal + more
  // #####################################

  replace(ast) {
    return estraverse.replace(ast, this._buildTraverseHandler());
  }

  enter({ node, key, parent }, getStackRef) {
    // console.log([node.type, parent.type]);
    // ref.replace(instrumentNode(node));
  }

  leave() { }
}

// #######################################################################################
// instrumentObjectTracker
// #######################################################################################

class ObjectTrackerTraverser extends ESTraverser {
  leave(ref) {
    const { node } = ref;
    const parentRef = this.getStackRef(1);
    const parent = parentRef && parentRef.node;
    // only consider nodes that represent a possible get value
    if (parent && 
      node.type === "Identifier" &&
      !identifierIgnoredParents.has(parent.type) &&
      !this.isNonComputedProperty() &&
      !this.isRightMostAssignmentLHS()
    ) {
      // see: https://github.com/estools/estraverse/blob/master/estraverse.js#L330
      ref.replace(instrumentNode(node));
      // node.name = 'aa';
    }
  }
}

export function instrumentObjectTracker(code) {
  code = code + '';

  const ast = esprima.parseScript(code);
  new ObjectTrackerTraverser().replace(ast);

  const resultCode = escodegen.generate(ast);
  if (typeof window !== 'undefined') {
    window.document.body.innerHTML = `<pre>${resultCode}</pre>`;
  }
  return eval(`(${resultCode})\n\n//# sourceURL=instrumented_testCode.js`);
}

function noop(...args) { }

function testObjectTrace(a) {
  var b = 3;
  var c = a;

  a = { y: 33 };

  function f(arg) {
    noop(arg);
  }

  noop(a);
  noop(b);
  noop(b + a.x);
  f(a);
  f(c);
  a.x = b * b;

  a.x *= a.x;


  noop(f(c));

  // class D {
  //   x = b;
  //   y = a;
  //   z = [b, c];
  // }

  // var d = new D();
}

export function runEsTest() {
  window.__dbgs_logObjectTrace = __dbgs_logObjectTrace;
  window.noop = noop;

  const code = instrumentObjectTracker(testObjectTrace);

  var a = { x: 1 };
  trackObject(a, 'a');

  console.log(code);
  code(a);
}