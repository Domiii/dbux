// Program

const _dbuxRuntime = require('dbux-runtime');
const _dbux = _dbux_init(_dbuxRuntime);

try {
  // Program body

  function f1(a, b) {
    const id1 = _dbux.pushImmediate(staticId1, a, b);

    try {
      // f1 body
      setTimeout(scheduleCallback(staticId12, id1, function f2() {
        const id2 = _dbux.pushImmediate(staticId2);
        try {
          // f2 body
          setTimeout(scheduleCallback(staticId22, id2, f3), 1500);
        }
        finally {
          _dbux.popImmediate(id2);
        }
      }));

    }
    finally {
      _dbux.popImmediate(id1);
    }
  }



  function f3() {
    const id3 = _dbux.pushImmediate(staticId3);

    try {
      // f3 body
    }
    finally {
      popImmediate(id3);
    }
  }

  f1(1, 84);
}
finally {
  _dbux.popProgram();
}

function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram({
    filename: 'src/some/dir/myFile.js',
    staticSites: [ /*...*/ ]
  });
}


// ################################################################################################
// dbux runtime:
// ################################################################################################

function pushImmediate(contextId) {

}

const callbackWrappersByCallback = new Map();

/**
 * Edge-cases:
 * 1. Repeated use of CB by same sender
 * 2. Repeated use of CB by different senders
 * 
 * Rare edge-cases:
 * 3. Callback object identity must be ensured
 * 4. Callback object has custom properties that are needed
 */
function makeCallbackWrapper(scheduledContextId, cb) {
  return (...args) => {
    // make sure, the scheduledContextId is on the stack before starting it
    const cbLinkId = pushCallbackLink(scheduledContextId);

    try {
      return cb(...args);
    }
    finally {
      popCallbackLink(cbLinkId);
    }
  };
}

function scheduleCallback(staticContextId, schedulerId, cb) {
  const scheduledContextId = pushSchedule(staticContextId, schedulerId);
  return makeCallbackWrapper(scheduledContextId, cb);
}

function pushCallbackLink(scheduledContextId) {
  const cbId = ...;
  return cbId;
}

function popCallbackLink(cbContextId, cb) {
  
}


// TODO: setInterval + event listeners

function pushCallbackRepeated(contextId, cb) {

}