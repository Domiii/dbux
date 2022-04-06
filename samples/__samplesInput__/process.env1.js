/**
 * `process.env` or `process.env.X` should not get instrumented.
 */

console.log(process.env, process.env.X);