/**
 * `process.env` or `process.env.X` should not get instrumented.
 */

process.env.PATH.split(':');