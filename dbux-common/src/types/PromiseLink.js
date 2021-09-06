/**
 * A link between two promises.
 * A link implies: settling `from` also settles `to` (possibly off by one tick due to A+).
 * Also: `from` is nested, `to` is nesting (or "nester").
 * Also: `from` is "inner", `to` is "outer".
 * 
 * Examples:
 * 
 * `to = Promise.resolve(from)`
 * `to = new Promise(r => ... r(from))`
 * `to = ...then(() => from)`
 * `to = (async () => from)()`
 */
export default class PromiseLink {
  /**
   * Promise id of the `nestingPromise`
   * 
   * @type {number}
   */
  from;

  /**
   * Promise id of the promise that nests `from`
   * 
   * @type {number}
   */
  to;

  /**
   * The trace that created the link
   */
  traceId;
}