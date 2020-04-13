import sh from 'shelljs';
import EmptyObject from 'dbux-common/src/util/EmptyObject';


/**
 * Wrapper for `shelljs.exec`.
 * 
 * 1. Promisifies `shelljs.exec` with { async: true }.
 * 2. Handles error code 127 by default
 * 3. more sugar
 */
export default async function exec(command, options, ignoreNotFound = false) {
  options = {
    ...(options || EmptyObject),
    async: true
  };

  // promisify `shelljs.exec` with async: true
  const cloneResult = await new Promise((resolve) => {
    sh.exec(command, options, (code, out, err) => {
      resolve({
        code,
        out,
        err
      });
    });
  });
  if (!ignoreNotFound && cloneResult.code === 127) {
    // command not found
    // see: https://stackoverflow.com/questions/1763156/127-return-code-from
    throw new Error(`"${command}" failed because executable or command not found. Either configure it's absolute path or make sure that it is installed and in your PATH.`);
  }
  return cloneResult;
}