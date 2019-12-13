// Program

const _dbuxRuntime = require('dbux-runtime');
const _dbux = _dbux_init(_dbuxRuntime);

try {
  // Program body

  function f1(a, b) {
    const id1 = _dbux.push(staticId1, a, b);

    try {
      // f1 body
      setTimeout(scheduleCallback(staticId12, id1, function f2() {
        const id2 = _dbux.push(staticId2);
        try {
          // f2 body
          setTimeout(scheduleCallback(staticId22, id2, f3), 345);
        }
        finally {
          _dbux.pop(id2);
        }
      }));

    }
    finally {
      _dbux.pop(id1);
    }
  }



  function f3() {
    const id3 = _dbux.push(staticId3);

    try {
      // f3 body
    }
    finally {
      pop(id3);
    }
  }

  f1(1, 84);
}
finally {
  _dbux.popProgram();
}

function _dbux_init(dbuxRuntime) {
  return dbuxRuntime.initProgram({
    file: 'src/some/dir/myFile.js',
    staticSites: [
      { /* staticId0 */
        type: 1,
        name: 'src/some/dir/myFile.js'
      },
      { /* staticId1 */
        type: 2,
        name: 'f1',
        parent: staticId0,
        line: l1
      },
      { /* staticId12 */
        type: 3,
        name: 'f2',
        parent: staticId1,
        line: l12
      },
      { /* staticId2 */
        type: 2,
        name: 'f2',
        parent: staticId1,
        line: l2
      },
      { /* staticId22 */
        type: 3,
        name: 'f3',
        parent: staticId2,
        line: l22
      },
      { /* staticId3 */
        type: 2,
        name: 'f3',
        parent: staticId0,
        line: l3
      }
    ]
  });
}


// ################################################################################################
// dbux runtime:
// ################################################################################################

function push(contextId) {

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
    const cbContextId = pushCallbackLink(scheduledContextId);

    try {
      return cb(...args);
    }
    finally {
      popCallbackLink(cbContextId);
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