import { getDomPath, htmlElToString } from './core/util';
import { __dbgs_error, __dbgs_log } from './core/dbgsUtil';
import { runEsTest } from './estests';

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

/**
 * Example:
		instrumentEventHandlersInstance(this.$newTodo, {
			change(eventName, origCb, ...eventArgs) {
				console.log('on change!');
				return origCb(...eventArgs);
			}
		});
 */
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


// ###############################################################
// addEventListener
// ###############################################################

var addEventListenerHooks = new Map();

function hasAddEventListenerHook(el, eventName) {
  return addEventListenerHooks.has(eventName);
  // let events = addEventListenerHooks.get(el);
  // return events && events.has(eventName);
}

function registerAddEventListenerHook(el, eventName, eventHandler) {
  // if (!events) {
  //   events = new Map();
  // }
  if (addEventListenerHooks.has(eventName)) {
    __dbgs_error('Tried to register eventListener twice: ' + htmlElToString(el));
  }
  addEventListenerHooks.set(eventName, eventHandler);
}

export function instrumentAddEventListener() {
  const originalAddEventListener = window.HTMLElement.prototype.addEventListener;
  window.HTMLElement.prototype.addEventListener = function __dbgs_addEventListener(eventName, origEventHandler, ...moreArgs) {
    let eventHandler;
    if (!hasAddEventListenerHook(this, eventName)) {
      // new event listener
      __dbgs_log('[DOM]', '[addEventListener]', eventName, getDomPath(this).join(' > '));
      eventHandler = function (...eventArgs) {
        const [evt] = eventArgs;
        const path = evt.composedPath().filter(el => el.tagName).map(p => p.tagName.toLowerCase()).join('<');
        __dbgs_log('[DOM]', '[Event]', eventName, path); // ...eventArgs
        return origEventHandler.call(this, ...eventArgs);
      };
      registerAddEventListenerHook(this, eventName, eventHandler);
    }
    else {
      eventHandler = origEventHandler;
    }
    return originalAddEventListener.call(this, eventName, eventHandler, ...moreArgs);
  };

}


// ###############################################################
// install
// ###############################################################

export function install() {
  // instrument default event listeners
  // const eventListenerClasses = Array.from(getAllEventClasses(window));
  // eventListenerClasses.forEach(Clazz => instrumentAllEventHandlers(Clazz));
  instrumentAddEventListener();
  
  // export some stuff to window for dev purposes
  Object.assign(window, {
    // inst: eventListenerClasses;
    instrument,
    instrumentInstance,
    instrumentEventHandlers,
    instrumentEventHandlersInstance
  });

  // run some tests
  runEsTest();
}