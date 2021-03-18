
export async function sleep(delay) {
  return new Promise(r => setTimeout(r, delay));
}

/**
 * 
 */
export function onlyOnce(asyncCb) {
  // const promises = new Map();
  let promise;

  return async (...args) => {
    if (args.length > 0) {
      throw new Error(`onlyOnce currently does not support callbacks with parameters.`);
    }
    // let promise = promises.get(asyncCb);
    if (!promise) {
      // promises.set(asyncCb, promise = asyncCb(...args));
      promise = asyncCb(...args);
    }

    return promise;
  };
}