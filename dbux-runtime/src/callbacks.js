
/**
 * Edge-cases:
 * 1. Repeated use of CB by same sender
 * 2. Repeated use of CB by different senders
 * 
 * Rare edge-cases:
 * 3. Callback object identity must be ensured
 * 4. Callback object has custom properties that are needed
 */
export function makeCallbackWrapper(dbux, scheduledContextId, cb) {
  return (...args) => {
    // make sure, the scheduledContextId is on the stack before starting it
    const cbLinkId = dbux.pushCallbackLink(scheduledContextId);

    try {
      return cb(...args);
    }
    finally {
      dbux.popCallbackLink(cbLinkId);
    }
  };
}