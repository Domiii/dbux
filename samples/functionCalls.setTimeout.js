// Program

const dbux0 = require('dbux-runtime');
const dbux = _dbux_init1(dbux0);

const id0 = dbux.push(staticId0);

try {
  // Program body

  function f1(a, b) {
    const id1 = dbux.push(staticId1, a, b);

    try {
      // f1 body
      setTimeout(scheduleCallbackOneShot(staticId12, id1, function f2() {
        const id2 = dbux.push(staticId2);
        try {
          // f2 body
          setTimeout(scheduleCallbackOneShot(staticId22, id2, f3));
        }
        finally {
          dbux.pop(id2);
        }
      }));

    }
    finally {
      dbux.pop(id1);
    }
  }



  function f3() {
    const id3 = dbux.push(staticId3);

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
  pop(id0);
}

function _dbux_init1(dbuxRuntime) {
  return dbuxRuntime.initProgram({
    file: 'src/some/dir/myFile.js',
    instrumentedSites: [
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
      { /* staticId2 */
        type: 2,
        name: 'f2',
        parent: staticId1,
        line: l2
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
function wrapCallbackOneShot(scheduledContextId, cb) {
  return (...args) => {
    const cbContextId = pushCallbackStart(scheduledContextId);

    try {
      return cb(...args);
    }
    finally {
      popCallbackOneShot(cbContextId);
    }
  };
}

function scheduleCallbackOneShot(staticContextId, schedulerId, cb) {
  // TODO: no staticContextId
  const scheduledContextId = pushSchedule(staticContextId, schedulerId);
  return wrapCallbackOneShot(scheduledContextId, cb);
}

function pushCallbackStart(scheduledContextId) {
  // TODO: how to handle this "tree branching"
  // TODO: no staticContextId
  const cbId = ...;
  return cbId;
}

function popCallbackOneShot(cbContextId, cb) {
  
}


// TODO: setInterval + event listeners

function pushCallbackRepeated(contextId, cb) {

}