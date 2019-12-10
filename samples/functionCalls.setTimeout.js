// Program

// dbux.init() here

const id0 = dbux.push(staticId0);

try {
  function f1() {
    const id1 = dbux.push(staticId1);

    try {
      // f1 body
      setTimeout(pushCallbackOneShot(id1, function f2() {
        const id2 = dbux.push(staticId2);
        try {
          // f2 body
          setTimeout(pushCallbackOneShot(id2, f3));
        }
        finally {
          pop(id2);
        }
      }));

    }
    finally {
      pop(id1);
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

  f1();
}
finally {
  pop(id0);
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
function wrapCallbackOneShot(senderContextId, cb) {
  const wrapperCb = (...args) => {
    try {
      return cb(...args);
    }
    finally {
      popCallbackOneShot(senderContextId, cb);
    }
  };

  const wrapperContext = {
    cb,
    wrapperCb,
    senderContextId
  };

  callbackWrappersByCallback.set(cb, wrapperContext);

  return wrapperContext;
}

function pushCallbackOneShot(senderContextId, cb) {
  const context = wrapCallbackOneShot(cb);
  push(context);
  return context.wrapperCb;
}

function popCallbackOneShot(senderContextId, cb) {
  
}

function pushCallbackRepeated(contextId, cb) {

}