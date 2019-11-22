import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';
import { __dbgs_logObjectTrace, trackObject } from './trackObject';

const { Identifier, CallExpression } = esprima;

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

export function instrumentObjectTracker(code) {
  code = code + '';

  // TODO
  var ast = esprima.parseScript(code);
  estraverse.replace(ast, {
    enter: function (node, parent) {
      // console.log(node.type);
      if (node.type === "Identifier" &&
        parent.type !== 'FunctionDeclaration' &&
        node.name === 'a') {
          // console.log([node.type, parent.type]);
          this.__current.ref.replace(instrumentNode(node));
        // node.name = 'aa';
      }
      // if (node.type === 'Property') {
      //   this.remove();
      // }
    }
  });

  const resultCode = escodegen.generate(ast);
  window.document.body.innerHTML = `<pre>${resultCode}</pre>`;
  return eval(`(${resultCode})\n\n//# sourceURL=instrumented_testCode`);
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
  noop(c);
  f(a);

  a.x = b * b;

  a.x *= a.x;

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
  code(a);
}