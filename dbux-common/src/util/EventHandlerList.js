import isFunction from 'lodash/isFunction';

export default class EventHandlerList {
  _unsubscribeCallbacks = [];

  constructor(...unsubscribeCallbacks) {
    this.subscribe(unsubscribeCallbacks);
  }

  subscribe(...unsubscribeCallbacks) {
    unsubscribeCallbacks = unsubscribeCallbacks.flat(1000);
    this._unsubscribeCallbacks.push(...unsubscribeCallbacks.map(
      cb => {
        if (!isFunction(cb)) {
          throw new Error(`EventHandlerList.subcribe expects functions. Found: ${cb}`);
        }
        return cb;
      }
    ));
  }

  unsubscribe() {
    this._unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this._unsubscribeCallbacks = [];
  }
}