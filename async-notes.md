# Promises



## Promise Roles

### `async` function "caller tree"

**Sub-roles**:

* return value of `async` function
* `awaitArgument`

**Nested promises**:

* `await p`

**Strategies**:

* -> use `preEventContextId` to connect nested promise with caller promise.


### Promise tree

**Nested promises**:

* returned from `then`