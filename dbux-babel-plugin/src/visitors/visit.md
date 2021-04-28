
```js
traceId()
traceExpression(programId, inProgramStaticTraceId, value); // te(value, traceId)
traceWrite(targetPath, readTree, value, traceId)
```

## Assignments

### AssignmentExpression, VariableDeclaration, VariableDeclarator

* `VariableDeclarator` has two types of semantics:
  * `let`, `const`: creates new variables.
    * We can uniquely identify them by `traceId` of that write operation.
    * `uniquePathId` could be constructed by `name` + `contextId`.
  * `var`: only creates new variable, if not already existing in scope (or ancestor scopes), else refers to existing variable.
  * `declarations` contains multiple `VariableDeclaration`, each referring to their own variable.
* `AssignmentExpression`
  * `left` refers to existing variable.
  * We need to construct their `uniquePathId`:
    * Locally, by name, in scope or ancestor scopes.
      * We can get this information from [Scope.bindings.referencePaths[0]](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings)
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
function pVal(that, st, parentSt, val) { console.log('pVal', that, val); registerPropKeyValueAccess(that, st, val); return key; }

var stF = 1
var stFArg1 = 2
var stFResult = 3;
var stProp = 4;
function f(x) { return 'f' + x; };
class A {
  [pKey(this, stProp, 'p1', null)] = pVal(
    this, 
    stProp, 
    expr(stFResult, 
      expr(stF, f)(expr(stFArg1, 3))
    ),
    stFResult
    );
}

var a = new A();
console.log(a.p1);
```