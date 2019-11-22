import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';
import { __dbgs_logObjectTrace, trackObject } from './trackObject';

const { Identifier, CallExpression, Syntax } = esprima;

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

// ################################################
// AST node classifications
// ################################################

/**
 * E.g.: `a` in `{ a: 1 }`
 * NOTE: `computed = true` would be `{ [a]: 1 }`
 */
export function isNodeNonComputedProperty(node) {
  return node.type === 'Property' && !node.computed;
}

/**
 * E.g.: `z` in `x.y.z = 1;`
 */
export function isRightMostAssignmentLHS(node) {

}

// ################################################
// instrumentObjectTracker
// ################################################

export function instrumentObjectTracker(code) {
  code = code + '';

  const stack = [];
  function getAncestor(i) {
    return stack[stack.length - i - 1];
  }

  const ast = esprima.parseScript(code);
  estraverse.replace(ast, {
    enter: function (node, parent) {
      const { ref } = this.__current;
      stack.push(ref);

      const { key } = ref;

      // only consider nodes that represent a possible get value
      if (node.type === "Identifier" &&
        !isNodeNonComputedProperty(parent) &&
        !isRightMostAssignmentLHS() &&
        !identifierIgnoredParents.has(parent.type)
      ) {
          // console.log([node.type, parent.type]);
          // see: https://github.com/estools/estraverse/blob/master/estraverse.js#L330
          this.__current.ref.replace(instrumentNode(node));
        // node.name = 'aa';
      }
    },
    leave: function (node, visitor) {
      stack.pop();
    }
  });

  const resultCode = escodegen.generate(ast);
  window.document.body.innerHTML = `<pre>${resultCode}</pre>`;
  return eval(`(${resultCode})\n\n//# sourceURL=instrumented_testCode.js`);
}

function noop(...args) { }

function testObjectTrace(a) {
  var b = 3;
  var c = a;

  function f(arg) {
    noop(arg);
  }

  noop(a);
  noop(b);
  noop(b + a.x);
  f(a);
  f(c);

  a = {y: 33};
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