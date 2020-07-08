/**
 * Process wrapper for running things in the VSCode terminal and communicating
 * process information back to caller extension.
 */
const spawn = require('child_process');
const process = require('process');
const io = require('socket.io-client');

const Verbose = true;

// node run.js port "cwd" "command"
const [
  _node,
  _runJs,
  port,
  cwd,
  command
] = process.argv;


function main() {
  const processOptions = {
    cwd
  };

  spawn.exec(command, processOptions);

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


  process.on('exit', (code, signal) => {
    // logger.debug(`process exit, code=${code}, signal=${signal}`);
    if (checkDone()) { return; }

    reportStatusCode(code);
  });

  process.on('error', (err) => {
    if (checkDone()) { return; }

    reportError(`[${err.code}] ${err.message || JSON.stringify(err)}`);
  });
}


// ###########################################################################
// handle results + send data
// ###########################################################################

let socket;
let queue = [];
let killTimer;

const StayAwake = false;
const KillDelay = 200;

function connect() {
  if (socket) {
    return;
  }

  const Remote = `ws://localhost:${port}`;
  socket = io.connect(Remote, {
    // jsonp: false,
    // forceNode: true,
    port,
    transports: ['websocket']
  });

  socket.on('reconnect_attempt', () => {
    Verbose && console.debug('[run.js] reconnecting...');
    // socket.io.opts.transports = ['websocket'];
  });
  socket.on('connect', () => {
    flushQueue();
  });
  socket.on('connect_error', (err) => Verbose && console.debug('[run.js] failed to connect', err));
  socket.on('error', (err) => console.error(`[run.js]`, err));
  socket.on('disconnect', () => {
    socket = null;
  });
}


function flushQueue() {
  socket.emit(queue);
  queue = [];

  _refreshKillTimer();
}

function _refreshKillTimer() {
  if (StayAwake) {
    // stay awake
    return;
  }

  // disconnect after a while
  if (killTimer) {
    clearTimeout(killTimer);
  }
  killTimer = setTimeout(() => socket.disconnect(), KillDelay);
}

function sendData(data) {
  connect();

  queue.push(data);

  if (socket.connected) {
    flushQueue();
  }
}

function reportStatusCode(code) {
  sendData({
    code
  });
}

function reportError(error) {
  sendData({
    error
  });
}


// go!
main();