export function instrument(Clazz, methodName, cb) {
  const f = Clazz.prototype[methodName];
  // console.log('instrumenting', Clazz.name);
  Clazz.prototype[methodName] = function (...args) {
    return cb.call(this, f, ...args);
  };
}

export function instrumentInstance(obj, methodName, cb) {
  instrument(obj.constructor, methodName, cb);
}

export function getAllEventNames(Clazz) {
  return Object.getOwnPropertyNames(Clazz.prototype)
    .filter(key => {
      try {
        // console.log(key, key.startsWith('on'));
        return key.startsWith('on'); // && typeof (Clazz[key]) === 'function';
      }
      catch (err) {
        console.error(Clazz.name, key, err);
      }
    })
    .map(eventName => eventName.substring(2));
}

export function instrumentAllEventHandlers(Clazz) {
  const eventNames = getAllEventNames(Clazz);
  const eventCallback = function (eventName, orig, ...eventArgs) {
    // TODO: add advanced logging library
    console.log(this, 'event', eventName);
    return orig(...eventArgs);
  };
  const eventCallbacks = Object.fromEntries(eventNames.map(eventName => [
    eventName,
    eventCallback
  ]));
  console.log(Clazz.name, eventCallbacks);
  return instrumentEventHandlers(Clazz, eventCallbacks);
}

function nestEventHandler(eventName, originalEventHandler, eventHandlerOverride) {
  if (eventHandlerOverride) {
    Object.defineProperty(eventHandlerOverride, 'name', {
      value: `__dbgs_${eventHandlerOverride.name && eventHandlerOverride.name !== eventName && eventHandlerOverride.name || `on_${eventName}`}`
    });
    eventHandlerOverride = eventHandlerOverride.bind(this, eventName, originalEventHandler);
  }
  else {
    eventHandlerOverride = originalEventHandler;
  }
  return function __dbgs_instrumendEventHandler(...evtArgs) {
    console.log(this, 'event', eventName);
    return eventHandlerOverride(...evtArgs);
  };
}

export function instrumentEventHandlers(Clazz, eventCallbacks) {
  return instrument(Clazz, 'addEventListener', function (originalAddEventListener, ...args) {

    // TODO: fix this utterly broken logic......!!

    let [
      eventName,
      originalEventHandler,
      ...otherArgs
    ] = args;

    originalEventHandler = originalEventHandler.bind(this);

    let eventCallback = eventCallbacks[eventName];
    const instrumentedEventListener = nestEventHandler(eventName, originalEventHandler, eventCallback);
    return originalAddEventListener.call(this, eventName, instrumentedEventListener, ...otherArgs);
  });
}

export function instrumentEventHandlersInstance(obj, eventCallbacks) {
  return instrumentEventHandlers(obj.constructor, eventCallbacks);
}

// instrument(Node, 'addEventListener');

function* getAllEventClasses(obj) {
  for (const k of Object.getOwnPropertyNames(obj)) {
    const v = obj[k];
    if (v && v.prototype 
      // && (v == window.Node || !(v instanceof window.Node))
      ) {
      if (v.prototype['addEventListener']) {
        yield v;
      }
    }
  }
}


export function install() {
  // instrument default event listeners
  // const eventListenerClasses = Array.from(getAllEventClasses(window));
  // eventListenerClasses.forEach(Clazz => instrumentAllEventHandlers(Clazz));

  //  the basics...
  const originalAddEventListener = window.HTMLElement.prototype.addEventListener;
  window.HTMLElement.prototype.addEventListener = function __dbgs_addEventListener(eventName, origEventHandler, ...moreArgs) {
    console.log('addEventListener', eventName);
    const eventHandler = function(...eventArgs) {
      console.log('event', eventName, ...eventArgs);
      return origEventHandler.call(this, ...eventArgs);
    };
    return originalAddEventListener.call(this, eventName, eventHandler, ...moreArgs);
  };

  // export some stuff to window for dev purposes
  Object.assign(window, {
    // inst: eventListenerClasses;
    instrument,
    instrumentInstance,
    instrumentEventHandlers,
    instrumentEventHandlersInstance
  });
}