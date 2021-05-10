
TODO
1. capture full expression tree and dependency tree for all `traceId`s
   * then pass dependency tree as argument to `traceWrite`
2. produce all rules to build `targetPathId` for any LVal
   * PROBLEM: sometimes, we cannot build it at the time of `DataNode` creation (e.g. `ObjectExpression`)
3. Determine all reads and writes
4. Instrument all missing babel-types
5. Capture effects of built-ins
   * TODO: `event` objects need some tracking
     * at least track `event.target`
   * TODO: Determine whether a given function is instrumented or not
   * TODO: Annotate built-ins with value-creating effects?
     * Some simple generalizations:
       * Check if return value of function is reference type, and reference was not recorded before
   * TODO: Some basic DOM wrapper?
     * event handlers need to track `event` objects
6. New approach to visualization
   * Call graph filtering: allow toggle showing `node_modules`?
     * Also: Give `node_modules` nodes a more blant color


5. Capture effects of built-in functions
 * NOTE: require monkey patching and/or proxies:
 * 
 * * Object (e.g. assign, defineProperty, getOwnPropertyDescriptor etc.)
 * * Array (e.g. copyWithin, map, entries, every etc.)
 * * any other built-in global object (Map, Set etc.): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
 * 
 * => Can we automize this process for any function that we know is not instrumented?
 * => Seems possible: https://javascript.info/proxy#proxy-apply


# Deal with hoisting

Capture all hoisted variables first, then query `Function` for all hoisted declarations

* 

# Relevant types

* Potential lvals
  * `MemberExpression`
    * `OptionalMemberExpression`
  * `Identifier`

  * patterns
     * `AssignmentPattern`
     * `RestElement`
     * `ObjectPattern`
     * `ArrayPattern`

* assignments
  * `AssignmentExpression`
  * `VariableDeclaration`
  * `ClassPrivateProperty`
  * `ClassProperty`

* function + calls
  * `Function`
  * `ReturnStatement`
  * `YieldExpression`

  * `CallExpression`
  * `OptionalCallExpression`
  * `NewExpression`
  * `Super`

* Arithmetic
  * `BinaryExpression`
  * `UnaryExpression`
  * `LogicalExpression`

* Value-creating/-changing
  * `UpdateExpression` [write]
    * add both `read` and `write` nodes, similar to the corresponding `AssignmentExpression` (i++ ~ i = i+1)
  * `ObjectExpression` [write]
    * 1 parent `read` + many `write` children
    * problem: we don't know the path when capturing the children writes
  * `TemplateLiteral`

* loops (all have reads + writes)
  * `ForStatement`
  * `ForInStatement`
  * `ForOfStatement`
  * `DoWhileLoop`
  * `WhileStatement`

* other
  * `IfStatement`
  * `SwitchStatement`
  * `SwitchCase`
  * `ConditionalExpression`
  * `SequenceExpression`
  * `Decorator`

* error propagation
  * `ThrowStatement`
  * `CatchClause` [write]

* `AwaitExpression`


* Other Statements (currently not of great concern to data dependency tracking)
  * `BreakStatement`
  * `ContinueStatement`
  * `TryStatement`
  * `ExpressionStatement`
  * `VariableDeclarator`



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
  * `ForInStatement.left`
  * `ForOfStatement.left`
  * `VariableDeclarator.id`
    * `var x = 3;`
* Other
  * `ClassDeclaration`, `Function`
    * sub-category: `Method`: getters + setters
      * Getters: `kind` === 'get'
        * e.g. `get f()`
      * Setters: `kind` === 'set'
        * e.g. `set f(val)`
  * `ClassPrivateProperty`, `ClassProperty`
    * NOTE: similar to `AssignmentExpression` with `left` <- `MemberExpression`
  * {`ReturnExpression`,`YieldExpression`}.`argument` -> `CallExpression`
    * also: `OptionalCallExpression`, `NewExpression`
    * if is constructor, returns `this`
  * `ThrowStatement` -> `CatchClause`
    * NOTE: similar to return from callee to caller
  * `ObjectExpression`
    * `properties` (recursive)
  * Arithmetic expression
  * `TemplateLiteral`
    * `expressions`
    * (`quasis`)
  * `SequenceExpression`
    * NOTE: right-most expression is returned
  * `AwaitExpression`
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
  * e.g. `{ x } = o`, `[ x ] = o` (`AssignmentExpression.left`)
  * NOTE: these are recursive
  * NOTE: can contain `AssignmentPattern`
    * e.g. `{ x = 3 } = o;`
* `MemberExpression`
  * e.g. `x.a`, `x[b]`
  * also `OptionalMemberExpression`


# Values

* `SwitchStatement`
  * `discriminant`
  * `SwitchCase.test`

## "Value-creating" types

Most expressions just pass along memory addresses, without actually generating new data. We want to differentiate between those, and those that create new values. The following AST types (mostly expressions) generate new values:

* CallExpression
  * *might* be "value-creating" if function is not instrumented
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
* ClassDeclaration
* TryStatement
* CatchClause
  * `param` is new iff we did not record `throw`
* Function
  * NOTE: includes `FunctionDeclaration` which is not an expression


## read tree propagation

## Complex read types

### MemberExpression
* `object`, `property`
* NOTE: we want to establish full chain, i.e.: `o.a.b.c.d.e`
* also: `OptionalMemberExpression`

```js
function f(x) { console.log('f', x); return x; }
var o = { p: { q: { a: 3 } } };
o[f('p')][f('q')].a
```
> f p
> f q
> 3

`%tid% = '%traceId% = %traceIdFn%(...)'`

* if ME is expression --
  * convert: `o.a[x].b.c[y]`
  * to: `te(o.a[te(x, %tid1%)].b.c[te(y, %tid2%)], %tid3%, %cmd%);`
    * `%cmd% = objectRead(tid3, tid1, tid2)`
  * advanced
    * conditional pathing
      * NOTE: cannot be LVal
      * `o?.a?.[p?.[x].a]`

* if ME is LVal --
  * convert: `o.a[x].b.c[y] = %value%`
  * to: `o.a[te(x, %tid1%, %cmd1%)].b.c[te(y, %tid2%, %cmd2%)] = traceWrite(te(...), %cmd0%)`
    * `%cmd0% = objectWrite(%tid0%, 0)`
    * `%cmd1% = objectWrite(tid0, 0)`
    * `%cmd2% = objectWrite(tid0, 1)`
  * advanced
    * nested MEs
      * NOTE: should work as-is, thanks to `tid0`
      * `o[q[a][b].c][p[x][y[z]].w]`

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

## Examples



## List

* ```js
  const TraceSliceType = new Enum({
    
  });
  class TraceSliceInfo {
    traceId,
    inputRefs,
    outputPath
  }
  class SliceReference {
    path,
    traceId,
    type
  }
  ```


## Other Parser notes....

# Parsing Examples

## Assignments


```js
// const d = a + b + c;

// let dPath, dId, aId, bId, cId;
const d = traceWrite(
  [bId, cId, aId],
  te(a, aId = traceId()) + 
    (te(b, bId = traceId()) + te(c, cId = traceId())),
  dId = traceId()
);
```

```js
// const o[a] = p[b].c + q.d[e];

// let dPath, dId, aId, bId, cId;
const d = traceWrite(
  [bId, cId, aId],
  te(a, aId = traceId()) + 
    (te(b, bId = traceId()) + te(c, cId = traceId())),
  dId = traceId()
);
```


### AssignmentExpression, VariableDeclaration, VariableDeclarator

* `VariableDeclarator` has two types of semantics:
  * `let`, `const`: creates new variables.
    * We can uniquely identify them by `traceId` of that write operation.
    * `targetPathId` could be constructed by `name` + `contextId`.
  * `var`: only creates new variable, if not already existing in scope (or ancestor scopes), else refers to existing variable.
  * `declarations` contains multiple `VariableDeclaration`, each referring to their own variable.
* `AssignmentExpression`
  * `targetPathId`:
    * first: try `getBindingPath`
      * if it exists, get `contextId` identifier (maybe via `staticContext`?)
      * final uniquely identifying path is (`id.name`, `contextId`)
      * TODO: consider acquiring `bindingPath`'s `traceId` instead?
    * else: if `bindingPath` does not exist, assume it's global?
  * 

## CallExpression



### Object/array property assignments

TODO


### ClassProperty

NOTE: `ClassProperty` can observe some complex recursive behavior. E.g.:

```js
const p = 'p1', q = 'q1';
class A {
  // NOTE: order is q.RHS -> p.RHS -> p.LHS -> qLHS
  [p] = new class B { [q] = 3; };
}
console.log(new A().p1.q1);
```

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
```


# @dbux/runtime

## Runtime functions

```js
traceId(programId, inProgramStaticTraceId)
te(value, thisTraceId = traceId(programId, inProgramStaticTraceId)) // traceExpression(programId, inProgramStaticTraceId, value, traceId);

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
