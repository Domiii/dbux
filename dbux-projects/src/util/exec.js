import Process from './Process';

/**
 * Wrapper for `shelljs.exec`.
 * 
 * 1. Promisifies `shelljs.exec` with { async: true }.
 * 2. Handles error code 127 by default
 * 3. more sugar
 */
export default async function exec(command, logger, options) {
  const process = new Process();
  return process.start(command, logger, options);
}