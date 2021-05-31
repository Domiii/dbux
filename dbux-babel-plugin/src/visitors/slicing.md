TODOs moved to: https://github.com/Domiii/dbux/issues/521


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
  * `{Array,Object}Expression` [write]
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



# Edges

## !Jump

### Write && !Jump
* `AssignmentExpression`
  * e.g.
    * `l = r` -> `l = tw(r, %tid2%)`
    * `l = a + b` -> `l = tw(te(a + b, %tid1%), %tid2%, [tid1])`
    * `l[x] = y` -> `l[te(x, %tid1%)] = twME()`
* `VariableDeclarator`
  * e.g. 
    * `var x = r;` -> `var x = tw(r, %tid0%);`
  * (used by `ForXStatement.left`)
    * (implies `ForInStatement`, `ForOfStatement`)
* `FunctionDeclaration`
* `ClassDeclaration`, e.g. `class A {}` -> `class A {}; tw(A, %tid0%);`

### Write && !Jump && Nested
* `Method`: `ClassMethod`, `ClassPrivateMethod`, `ObjectMethod`
  * sub-category getters + setters
    * Getters: `kind` === 'get'
      * e.g. `get f()`
    * Setters: `kind` === 'set'
      * e.g. `set f(val)`
* `ClassPrivateProperty`, `ClassProperty`
  * Variables: `static`
* `{Array,Object}Expression.properties`
  * NOTE: recursive
  * NOTE: need to get `refId` from parent, before being able to store the writes
  * `{ a: 1 }` -> `tOe({ a: tw(1, %tid1%) }, %tid0%, [tid1])`


### Read && !Jump
* Arithmetic expression
* `{Array,Object}Expression`
* `TemplateLiteral`
  * `expressions`, (`quasis`)
* `SequenceExpression`
  * NOTE: right-most expression is returned
* `AwaitExpression`
* `ClassExpression`, e.g. `f(class A {})` -> `te(class A {}, %tid0%);`
* `Function`
  * `ArrowFunctionExpression`
  * `FunctionExpression`


## Jump

### Write && Jump
* `CallExpression.arguments` -> `Function.params`
  * more input types:
    * `RestElement`
      * `function f(...x) { ... }` (`last(Function.params)`)
    * `RestElement.argument`
      * `f(...x);`
  * more inputs: `callee`
    * can be `Super`
  * also: `OptionalCallExpression`, `NewExpression`
* `ThrowStatement` -> `CatchClause`
  * NOTE: similar to return from callee to caller

### Read && Jump
* {`ReturnExpression`,`YieldExpression`}.`argument` -> `CallExpression`
  * also: `OptionalCallExpression`, `NewExpression`
  * if is constructor, returns `this`


## Obscure/advanced (probably Future Work)
* `Object.defineProperty`
  * `get`, `set`, `value`
* `Decorator`
  * NOTE: similar to a `CallExpression` with trailing expression passed in as first argument?
* Proxy interactions
* String reference equality(???)
  * NOTE: In JS, one cannot access string reference (memory location)


# `LVal` types
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

* `{Call,New}Expression`
  * NOTE: is new iff we did not instrument the called function
* `ArighmeticExpression`
* `UpdateExpression`
* `{Array,Object}Expression`
  * (object initializer)
* `Literal`
  * (implies `TemplateLiteral`)
  * Expression, Pureish, Literal, Immutable
    * {BigInt,Boolean,Decimal,Null,Numeric,RegExp,String}Literal
* `ClassDeclaration`
* `Function`
  * NOTE: includes `FunctionDeclaration` and `Method` which are not expressions
* `CatchClause.param`
  * NOTE: is new iff we did not record corresponding `throw`
* `Decorator`


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
  * to: `o.a[te(x, %tid1%, %cmd1%)].b.c[te(y, %tid2%, %cmd2%)] = te(..., %cmd0%)`
    * `%cmd0% = objectWrite(%tid0%, 0)`
    * `%cmd1% = objectWrite(tid0, 0)`
    * `%cmd2% = objectWrite(tid0, 1)`
  * advanced
    * nested MEs
      * NOTE: should work as-is, thanks to `tid0`
      * `o[q[a][b].c][p[x][y[z]].w]`

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

# Some Complex Parsing Examples

## Object/array property assignments

```js
// TODO: how to nest deferred writes? (e.g. `tOe -> tOe -> tAe` etc.)
// traceExpression{Object,Array}
(trace{O,A}E)(objOrArr, tid, deferTid, inputTids)
  traceExpression(
    { 
      a: tw(1, %tid1%, %nid1%, %tid0%, []),
      [b]: tw(f(), %tid2%, %nid2%, tid0, [])
    },
    %tid0%,
    %declarationTid%,
    [tid1, tid2, ...]
  )
```


## ClassProperty

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


# Value identity

"Value identity" is a uid that can uniquely identify a value:

* For `object`, `array`, `function` ("reference types" or "object types"), it is `dataNode.refId`
  * That `refId` is assigned in `runtime`. It is the `traceId` that first recorded that object.
* For non-"object types", we, similarly, want to determine the `traceId` of when that value first came into existence.
  * Consider that many traces just access and move existing values, and do not actually create new values.
  * The algorithm is explained in [getValueIdentity](#getValueIdentity).


## ReferencedIdentifier vs. MemberExpression

* any `ReferencedIdentifier` refers to a variable name
  * -> `dataNode.varAccess` contains `declarationTid` (`traceId` that declared (or first recorded) the variable)
  * `accessId = declarationTid`
* any `ME` (`MemberExpression`) refers to accessing some object's (or other value, such as `int` or `string`) property
  * example of an `ME`: `f(x)[g(y)]`, where `object` = `f(x)` and `property` = `g(y)`
  * -> `dataNode.varAccess` contains:
    *  `objectTid` (`traceId` of `object`)
    *  `prop` (value of `property`)
  * `accessId = makeUid(${getValueIdentity(objectTid)}#${prop})`
    * TODO: `makeUid` should use a `Map` to convert that string into a number; to more easily maintain `AccessIdIndex`

## getValueIdentity

If a `value` is not an object, we can compute `valueIdentity` by post-processing in `DataNodeCollection.postAddRaw`.

Once computed, we want to store the computed `valueIdentity` in `dataNode.valueId`.

The algorithm is based on each `DataNode`'s `Trace`'s `TraceType`, as follows:

* Expressions
  * Steps
    * -> if `staticTrace.dataNode.isNew`: `valueIdentity` = `traceId`
    * -> else: `valueIdentity` = `inputs[0]` (`inputs.length === 1` is implied)
  * `TraceType` set:
    * `Literal`
      * NOTE: always new
    * `Declaration`
      * NOTE: always implies a "new" `undefined` value (if not initialized)
    * `ExpressionResult`, `ExpressionValue`
      * who? `ArithmeticExpression`
    * `CallExpressionResult`
      * NOTE: will need runtime to connect `CER` with its corresponding `return` trace
    * `CallArgument`
      * TODO: make sure, this works correctly
    * `WriteVar`
    * `WriteME`
    * `ReturnArgument`, `ThrowArgument`, `AwaitArgument`
* `BeforeCallExpression` -> same as `CallExpressionResult` (resolve in `CallExpressionResult`)
  * -> don't assign a `valueIdentity`.
  * NOTE: special handling in UI should reflect `CER` instead.
* `Identifier`, `ME` (`MemberExpression`)
  * `valueIdentity` same as the last `DataNode` referencing this `identifier`
    * -> lookup last entry in `Index` by `dataNode.accessId`

