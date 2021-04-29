
TODO
<<<<<<< Updated upstream
1. capture full and dependency expression tree for all `traceId`s
=======
1. capture full expression tree and dependency tree for all `traceId`s
>>>>>>> Stashed changes
   * then pass dependency tree as argument to `traceWrite`
2. produce all rules to build `targetPathId` for any LVal
3. Determine all reads and writes
4. Instrument all missing babel-types
5. Capture effects of built-in functions
<<<<<<< Updated upstream
   * Determine whether a given function is instrumented or not
=======
   * TODO: Determine whether a given function is instrumented or not
   * TODO: Annotate built-ins with value-creating effects?
     * Some simple generalizations:
       * Check if return value of function is reference type, and reference was not recorded before
>>>>>>> Stashed changes


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
<<<<<<< Updated upstream
 */



## @dbux/runtime

### Runtime functions

```js
traceId()
traceExpression(programId, inProgramStaticTraceId, value, traceId); // te(value, traceId)

traceWrite(targetPathId, readTree, value, traceId)

/**
 * `traceWriteResolve` does two things:
 *   (i) resolve the write that reads val1Id
 *   (ii) add a second read, that is the computed key
 * 
 * TODO: make sure, this works, even when used recursively
 */
traceWriteResolve(te(f('p1'), this, key1Id = traceId()), key1Id, val1Id)
traceWriteDeferred()
```

## Writes

### All write types
* All LVal types
  * `AssignmentExpression`
  * `CallExpression.arguments` -> `Function.params`
    * `RestElement`
      * `function f(...x) { ... }` (`last(Function.params)`)
    * `RestElement.argument`
      * `f(...x);`
    * also: `Super`
* All Lval types, excl. `MemberExpression`
=======




# Writes

### All write types
* inputs = all LVal types
  * `AssignmentExpression.left`
  * `CallExpression.arguments` -> `Function.params`
    * more input types:
      * `RestElement`
        * `function f(...x) { ... }` (`last(Function.params)`)
      * `RestElement.argument`
        * `f(...x);`
    * more inputs: `callee`
    * also: `OptionalCallExpression`, `NewExpression`
      * can be `Super`
* inputs = all Lval types, excl. `MemberExpression`
>>>>>>> Stashed changes
  * `ForInStatement.left`
  * `ForOfStatement.left`
  * `VariableDeclarator.id`
    * `var x = 3;`
* Other
<<<<<<< Updated upstream
  * `{Class,Enum}Declaration`, `Function`
=======
  * `ClassDeclaration`, `Function`
>>>>>>> Stashed changes
    * sub-category: `Method`: getters + setters
      * Getters: `kind` === 'get'
        * e.g. `get f()`
      * Setters: `kind` === 'set'
        * e.g. `set f(val)`
  * `ClassPrivateProperty`, `ClassProperty`
    * NOTE: similar to `AssignmentExpression` with `left` <- `MemberExpression`
  * {`ReturnExpression`,`YieldExpression`}.`argument` -> `CallExpression`
<<<<<<< Updated upstream
    * also: `Super`
  * `ThrowStatement` -> `CatchClause`
    * NOTE: similar to return from callee to caller
  * `ObjectExpression`
  * `UpdateExpression`
=======
    * also: `OptionalCallExpression`, `NewExpression`
    * if is constructor, returns `this`
  * `ThrowStatement` -> `CatchClause`
    * NOTE: similar to return from callee to caller
  * `ObjectExpression`
    * `properties` (recursive)
  * `UpdateExpression`
  * `TemplateLiteral`
    * `expressions`
    * (`quasis`)
  * `SequenceExpression`
    * NOTE: right-most expression is returned
  * `AwaitExpression`
>>>>>>> Stashed changes
* Obscure/advanced (probably Future Work)
  * `Object.defineProperty`
    * `get`, `set`, `value`
  * `Decorator`
    * NOTE: similar to a `CallExpression` with trailing expression passed in as first argument?
  * Proxy interactions
  * String reference equality(???)
    * NOTE: In JS, one cannot access string reference (memory location)

### `LVal` types
* `Identifier`
* `ArrayPattern`, `ObjectPattern`
  * `{ x } = o`, `[ x ] = o` (`AssignmentExpression.left`)
  * NOTE: these are recursive
  * NOTE: can contain `AssignmentPattern`
    * e.g. `{ x = 3 } = o;`
* `MemberExpression`
  * e.g. `x.a`, `x[b]`
  * also `OptionalMemberExpression`


<<<<<<< Updated upstream
### Mutating writes

Most "writes" just pass along memory addresses, without actually making any changes to the data. We want to differentiate between those, and those that write new values. The following AST nodes write new values:

* CallExpression
  * if function is not instrumented: maybe
=======
# Values

* `SwitchStatement`
  * `discriminant`
  * `SwitchCase.test`

## "Value-creating" types

Most expressions just pass along memory addresses, without actually generating new data. We want to differentiate between those, and those that create new values. The following AST types (mostly expressions) generate new values:

* CallExpression
  * *might* be "value-creating" if function is not instrumented
>>>>>>> Stashed changes
* NewExpression
* UpdateExpression
* BinaryExpression
* LogicalExpression (||, &&, ??)
* ObjectExpression
  * (object initializer)
* TemplateLiteral
* UnaryExpression
  * iff input and output is not equal (`===`)
* Literal
  * Expression, Pureish, Literal, Immutable
  * {BigInt,Boolean,Decimal,Null,Numeric,String}Literal
* Decorator
<<<<<<< Updated upstream
* Declaration
  * {Class,Enum}Declaration
=======
* ClassDeclaration
>>>>>>> Stashed changes
* TryStatement
* CatchClause
  * `param` is new iff we did not record `throw`
* Function
<<<<<<< Updated upstream


## reads

TODO: all reads and their dependency trees

* `SwitchStatement`
  * `discriminant`
  * `SwitchCase.test`
=======
  * NOTE: includes `FunctionDeclaration` which is not an expression


## read tree propagation

### Propagating expression types

NOTE: all these are also "Value-creating types"

* BinaryExpression
  * `left`, `right`
* LogicalExpression
  * `left`, `right`
* UnaryExpression
  * `argument`

## Complex read types

* MemberExpression
  * `object`, `property`
  * NOTE: we want to establish full chain, i.e.: `o.a.b.c.d.e`
  * also: `OptionalMemberExpression`

## 


# Parser

## Concepts

* Reads
  * inputs are:
    * either propagated as-is ("Propagating expression types"; also "value-creating")
    * or mapped to output
* Writes
  * possible "targetPaths":
    * one or more variables
    * zero or more paths in those variables
* `ParseStack`
* generic data (mark `onEnter`):
  * `isLVal`
* TODO: do we need to separate parsing from code generation into two separate passes?
  * `parse`
  * `gen`


# Runtime Data Structures

* ```js
  const TraceSliceType = new Enum({
    
  });
  class TraceSliceInfo {
    traceId,
    inputPaths,
    outputPaths
  }
  class SliceReference {
    path,
    traceId,
    creating,
    type
  }
  ```


## Other Parser notes....
>>>>>>> Stashed changes

## Assignments

### AssignmentExpression, VariableDeclaration, VariableDeclarator

* `VariableDeclarator` has two types of semantics:
  * `let`, `const`: creates new variables.
    * We can uniquely identify them by `traceId` of that write operation.
    * `targetPathId` could be constructed by `name` + `contextId`.
  * `var`: only creates new variable, if not already existing in scope (or ancestor scopes), else refers to existing variable.
  * `declarations` contains multiple `VariableDeclaration`, each referring to their own variable.
* `AssignmentExpression`
  * `targetPathId`:
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
  [traceWriteResolve(te(f('p1'), this, key1Id = traceId()), key1Id, val1Id)] = traceWriteDeferred(
    deferredTargetPath(this, deferedVar('key1Id')), 
    [ ... ],
    te(te(f, ...)(te(3, ...), ...),
    val1Id = traceId()
    );
}

var a = new A();
console.log(a.p1);
<<<<<<< Updated upstream
```
=======
```


# @dbux/runtime

## Runtime functions

```js
traceId()
traceExpression(programId, inProgramStaticTraceId, value, traceId); // te(value, traceId)

traceWrite(targetPathId, readTree, value, traceId)

/**
 * `traceWriteResolve` does two things:
 *   (i) resolve the write that reads val1Id
 *   (ii) add a second read, that is the computed key
 * 
 * TODO: make sure, this works, even when used recursively
 */
traceWriteResolve(te(f('p1'), this, key1Id = traceId()), key1Id, val1Id)
traceWriteDeferred()
```
>>>>>>> Stashed changes
