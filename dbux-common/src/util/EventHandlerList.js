

export default class EventHandlerList {
  _unsubscribeCallbacks = [];

  constructor(...unsubscribeCallbacks) {
    this.subscribe(...unsubscribeCallbacks);
  }

  subscribe(...unsubscribeCallbacks) {
    this._unsubscribeCallbacks.push(...unsubscribeCallbacks);
  }

  unsubscribe() {
    this._unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this._unsubscribeCallbacks = [];
  }
}