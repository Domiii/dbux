/* eslint no-console: 0 */

/**
 * Process wrapper for running things in the VSCode terminal and communicating
 * process information back to caller extension.
 */
const spawn = require('child_process');
const fs = require('fs');
const path = require('path');
const process = require('process');

const Verbose = true;
const runningTimeout = 10000;

// node run.js port "cwd" "command"
const [
  _node,
  _runJs,
  argsEncoded
] = process.argv;

const args = JSON.parse(Buffer.from(argsEncoded, 'base64').toString('ascii'));
const { cwd, command, tmpFolder, args: moreEnv } = args;

console.debug('run.js command received:', args);

function main() {
  const processOptions = {
    cwd,
    detached: false,
    stdio: "inherit",
    env: {
      ...process.env,
      ...moreEnv
    }
  };
  

  // run it!
  const child = spawn.exec(command, processOptions);

  const startTime = new Date();
  const warningIntervalId = setInterval(() => {
    let seconds = ((new Date()) - startTime) / 1000;
    console.log(`Task running for ${seconds.toFixed(2)} seconds.`);
  }, runningTimeout);


  // ###########################################################################
  // process monitoring
  // ###########################################################################

  // done
  let done = false;
  function checkDone() {
    if (done) {
      return true;
    }
    done = true;

    return false;
  }


  child.on('exit', (code, signal) => {
    // logger.debug(`process exit, code=${code}, signal=${signal}`);
    if (checkDone()) { return; }

    reportStatusCode(code);
    clearInterval(warningIntervalId);

    console.log(`Done. You can close the Terminal now.`);
  });

  child.on('error', (err) => {
    if (checkDone()) { return; }

    reportError(`[${err.code}] ${err.message || JSON.stringify(err)}`);
    clearInterval(warningIntervalId);

    console.error(`Error:`, err);
  });

  // inherit stdio
  child.stdout.pipe(process.stdout);
  process.stdin.pipe(child.stdin);
  child.stderr.pipe(process.stderr);
}


// ###########################################################################
// handle results + send data
// ###########################################################################

function reportStatusCode(code) {
  fs.writeFileSync(path.join(tmpFolder, code.toString()), '');
}

function reportError(error) {
  fs.writeFileSync(path.join(tmpFolder, 'error'), error);
}


// go!
main();

setInterval(() => {}, 10000);