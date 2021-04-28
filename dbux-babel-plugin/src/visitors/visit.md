
TODO
1. capture full and dependency expression tree for all `traceId`s
   * then pass dependency tree as argument to `traceWrite`
2. produce all rules to build `uniquePathId` for any LVal
3. Determine all reads and writes
4. Instrument all missing babel-types
5. Capture effects of built-in functions
   * Determine whether a given function is instrumented or not


4. missing Babel types
 * AssignmentPattern
 * RestElement
 * ObjectPattern
 * ArrayPattern
 * ObjectExpression


5. Capture effects of built-in functions
 * NOTE: require monkey patching and/or proxies:
 * 
 * * Object (e.g. assign, defineProperty, getOwnPropertyDescriptor etc.)
 * * Array (e.g. copyWithin, map, entries, every etc.)
 * * any other built-in global object (Map, Set etc.): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
 * 
 * => Can we automize this process for any function that we know is not instrumented?
 * => Seems possible: https://javascript.info/proxy#proxy-apply
 */



## @dbux/runtime

### Main functions

```js
traceId()
traceExpression(programId, inProgramStaticTraceId, value); // te(value, traceId)
traceWrite(targetPath, readTree, value, traceId)
```

## Writes

* All write types
  * All LVal types
    * `AssignmentExpression`
    * `CallExpression.arguments` -> `Function.params`
      * `RestElement`
        * `function f(...x) { ... }` (`last(Function.params)`)
      * `RestElement.argument`
        * `f(...x);`
  * All Lval types, excl. `MemberExpression`
    * `ForInStatement.left`
    * `ForOfStatement.left`
    * `VariableDeclarator.id`
      * `var x = 3;`
  * Other
    * (`return`/`yield`).`argument` -> `CallExpression`

* `LVal` types
  * `Identifier`
  * `ArrayPattern`, `ObjectPattern`
    * `{ x } = o`, `[ x ] = o` (`AssignmentExpression.left`)
    * NOTE: these are recursive
    * can contain `AssignmentPattern`
      * `{ x = 3 } = o;`
  * `MemberExpression`
    * `x.a`, `x[b]`

TODO:
* multiple read sources for one write
  * e.g. `ClassProperty` (or any property access) -> `key` (if computed) + `value`
  * 
* deferred writes: read happens before targetPath can be computed
  * e.g. `ClassProperty`
  * e.g. arg -> parameter; return value

* TODO
  * for every scenario, identify:
    * path of all `LVal` variables
      * (usually just one, only `ArrayPattern` + `ObjectPattern` have multiple)
    * set of paths inside variable

## Assignments

### AssignmentExpression, VariableDeclaration, VariableDeclarator

* `VariableDeclarator` has two types of semantics:
  * `let`, `const`: creates new variables.
    * We can uniquely identify them by `traceId` of that write operation.
    * `uniquePathId` could be constructed by `name` + `contextId`.
  * `var`: only creates new variable, if not already existing in scope (or ancestor scopes), else refers to existing variable.
  * `declarations` contains multiple `VariableDeclaration`, each referring to their own variable.
* `AssignmentExpression`
  * `uniquePathId`:
    * Locally, by name, in scope or ancestor scopes.
      * We can get this information from [Scope.bindings[name].referencePaths[0]](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings)
    * Global
  * 

```js
const a = 1;
const b = 2;
const c = 3;

// const d = a + b + c;

// let dPath, dId, aId, bId, cId;
const d = traceWrite(
  dPath,
  [[bId, cId], aId],
  te(a, aId = traceId()) + 
    (te(b, bId = traceId()) + te(c, cId = traceId())),
  dId = traceId()
);
```

## CallExpression



### Object/array property assignments

TODO


### ClassProperty

```js
function setPKey(that, st key) { ... }
function registerPropKeyValueAccess(that, st, value) {
  const key = getAndDeleteKey(that, st);
  register(st, {
    read: [
      that,
      key,
      value
    ],
    write: [
      that,
      objPath(that, key)
    ]
  });
}
function expr(st, val) { registerRead(st, val); return val; }
function pKey(that, st, parentSt, key) { console.log('pKey', that, key); setPKey(that, st, key); return key; }

var stF = 1
var stFArg1 = 2
var stFResult = 3;
var stProp = 4;
function f(x) { return 'f' + x; };

// let key1Id, val1Id

class A {
  // [f('p1')] = f(3);
  // TODO: here, `traceWriteResolve` does two things: (i) resolve the write that reads val1Id, (ii) add a second read, that is the computed key f('p1')
  [traceWriteResolve(te(f('p1'), this, key1Id = traceId()), key1Id, val1Id)] = traceWriteDeferred(
    deferredTargetPath(this, deferedVar(computedKey)), 
    [ ... ],
    te(te(f, ...)(te(3, ...), ...),
    val1Id = traceId()
    );
}

var a = new A();
console.log(a.p1);
```