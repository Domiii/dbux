import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import { __dbgs_logObjectTrace, trackObject } from './core/trackObject';
import ESTraverser from './core/ESTraverser';

const { Identifier, CallExpression, Syntax } = esprima;


// see: https://esprima.org/demo/parse.html
// see: https://github.com/jquery/esprima/tree/master/src/syntax.ts

function instrumentNode(origNode) {
  // __dbgs_logObjectTrace(x);
  // return x;
  const parseConfig = {};
  const ast = esprima.parseScript('__dbgs_logObjectTrace(1)', parseConfig);
  const newNode = ast.body[0].expression;

  console.assert(newNode.type === 'CallExpression');

  // replace first argument with origNode
  newNode.arguments[0] = origNode;

  // console.log(JSON.stringify(newNode, null, 2));
  return newNode;
}

export const identifierIgnoredParents = new Set([
  'FunctionDeclaration'
]);

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
      !this.isRightMostAssignmentLHS() &&
      !this.isAssignmentLValue()
    ) {
      // see: https://github.com/estools/estraverse/blob/master/estraverse.js#L330
      ref.replace(instrumentNode(node));
      // node.name = 'aa';
    }
  }
}

export function instrumentObjectTracker(code) {
  code = code + '';

  const parseConfig = {
    range: true,
    loc: true
  };
  const ast = esprima.parseScript(code, parseConfig);
  new ObjectTrackerTraverser().replace(ast);

  const genConfig = {
    //sourceMap: true
  };
  const resultCode = escodegen.generate(ast, genConfig);
  if (typeof window !== 'undefined') {
    window.document.body.innerHTML = `<pre>${resultCode}</pre>`;
  }
  return eval(`(${resultCode})\n\n//# sourceURL=instrumented_testCode.js`);
}

function noop(...args) { }

function testObjectTrace(a) {
  var c = a;
  var b = 3;

  a = { y: 33 };

  function f(arg) {
    noop(arg);
  }

  noop(a);
  noop(b);
  noop(c);
  noop(b + a.x);
  f(a);
  f(c);
  a.x = b * b;

  if (a.y > 30) {
    noop(a);
  }
  else {
    noop(c);
  }

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
  // setup some globals
  window.__dbgs_logObjectTrace = __dbgs_logObjectTrace;
  window.noop = noop;

  // instrument code
  const code = instrumentObjectTracker(testObjectTrace);

  // create object
  const a = { x: 1 };

  // track object
  trackObject(a, 'a');

  // run code (while tracking object through code)
  code(a);
}