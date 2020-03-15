import justRunMyPlugin from '../testing/justRunMyPlugin';
import { getRealVariableNames, getRealVariableNamesInLoc1D } from '../helpers/bindingsHelper';
import { getPreBodyLoc1D } from '../helpers/locHelpers';
import { getContextPath } from '../helpers/traversalHelpers';
import { getCalleeName } from '../helpers/callHelpers';
import { isNodeInstrumented } from '../helpers/instrumentationHelper';

function expectPathBindingNames(path, names) {
  const varNames = getRealVariableNames(path);
  expect(varNames).toIncludeSameMembers(names);
}

function expectPathBindingNamesInLoc1D(path, loc1D, names) {
  const varNames = getRealVariableNamesInLoc1D(path, loc1D);
  expect(varNames).toIncludeSameMembers(names);
}

/**
 * @see https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings
 */

function run(code, enterVisitor) {
  function plugin() {
    return {
      visitor: enterVisitor,
    };
  }

  justRunMyPlugin(code, plugin, {
    filename: __filename
  });
}


test('function bindings', () => {
  run(`
    const myGlobal = 3;
    function f(x, { a, b: [c] }) { 
      let k = 3;
      console.log(a, k, myGlobal);
    }
    `, {
    Function(path, state) {
      // const params = path.get('params');

      // get all bindings in function
      expectPathBindingNames(path, ['x', 'a', 'c', 'k']);

      // get all bindings in body
      expectPathBindingNamesInLoc1D(path, path.get('body').node, ['a', 'k', 'k']);

      // get only function parameters
      // const functionSignatureLoc1Ds = params.map(paramPath => param.node);
      const functionSignatureLoc = getPreBodyLoc1D(path);
      expectPathBindingNamesInLoc1D(path, functionSignatureLoc, ['x', 'a', 'c']);
    },

    CallExpression(callPath, state) {
      if (isNodeInstrumented(callPath.node)) { return; }  // ignore paths that have been instrumented by babel

      // we only have a single call (that is, console.log)
      const calleeName = getCalleeName(state, callPath);
      expect(calleeName).toBe('console.log');

      const contextPath = getContextPath(callPath);
      // NOTE: `myGlobal` is not are declared in the context (function f)
      expectPathBindingNamesInLoc1D(contextPath, callPath.node, ['a', 'k'/*, myGlobal */]);
    }
  });
});


test('for-of bindings', () => {
  run(`let lastN = null;
    let x, y;
    for ([x, y] of [[1, 2]]) {
      const x2 = 3;
      var v1, v2;           // NOTE: hoisted to function scope
      console.log(x, x2, v1);
    }
  `, {
    Program(path, state) {
      expect(path.scope.bindings.y.referencePaths.length).toBe(0);  // this should be 1, not 0
      expect(path.scope.bindings.y.constantViolations[0].isForOfStatement()).toBeTruthy();  // should be `Identifier`, not `ForOfStatement`, no?
    },
    ForOfStatement(path, state) {
      expectPathBindingNames(path, []);  // no variable is declared in the loop signature
      expectPathBindingNames(path.get('left'), []); // no variable is declared in `left`
      expectPathBindingNames(path.get('body'), ['x2']);  // only `x2` is declared in the loop body

      // TODO: get all variables in loop signature (does not work as we would like it to :( )
      // const contextPath = getContextPath(path);
      // const signatureLoc = getPreBodyLoc1D(path);
      // expectPathBindingNamesInLoc1D(contextPath, signatureLoc, ['x', 'y']);  // y + y are referenced in the loop signature
    },

    // CallExpression(callPath, state) {
    //   if (isNodeInstrumented(callPath.node)) { return; }  // ignore paths that have been instrumented by babel

    //   // we only have a single call (that is, console.log)
    //   const calleeName = getCalleeName(state, callPath);
    //   expect(calleeName).toBe('console.log');

    //   // x2 and x3 are declared in the context (Program)
    //   const contextPath = getContextPath(callPath);
    //   const myGlobal = 3;
    //   expectPathBindingNamesInLoc1D(contextPath, callPath.node, ['x2', 'x3']);
    // }
  });
});

