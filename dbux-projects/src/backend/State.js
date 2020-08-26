const DefaultUpdateDelay = 10;


/**
 * Hacked together some very simple "react-like" state object.
 * Since we don't have react's render tree and mount/unmount events, we have to manually subscribe and unsubscribe to `setState` updates though.
 */
class State {
  _state = {};
  _registeredListeners = new Map(); // listeners listening for specific key
  _updateListeners = []; // listenrs listening for anything
  _changed = {};


  // all info pertaining to last scheduled update
  _timer = null;
  _scheduledListeners = [];

  constructor(initialState) {
    this._state = initialState || {};
  }

  get get() {
    return this._state;
  }

  clear() {
    for (const key in this._state) {
      this._notifyUpdate(key, null);
    }
    this._state = {};

    this._scheduleUpdate();
  }

  /**
   * Get all listeners of key
   */
  getListeners(key) {
    return this._registeredListeners.get(key);
  }

  /**
   * Given callback is called on any state change
   */
  onUpdate(listener) {
    this._updateListeners.push(listener);
  }

  /**
   * Given callback is only called on state changes of given key
   */
  addListener(key, listener) {
    let listeners = this.getListeners(key);
    if (!listeners) {
      this._registeredListeners.set(key, listeners = []);
    }
    listeners.push(listener);
    
    // return a function to remove this listener from the key
    return () => {
      listeners.splice(listeners.indexOf(listener), 1);
      return true;
    };
  }
  
  setState(update, customListener) {
    // first update state object
    for (const key in update) {
      const value = update[key];
      this._state[key] = value;

      this._notifyUpdate(key, value);
    }

    customListener && this._scheduledListeners.push(customListener);
    
    // ...then schedule an update
    this._scheduleUpdate();
  }

  _notifyUpdate(key, value) {
    const l = this.getListeners(key);
    l && this._scheduledListeners.push(...l);
    this._changed[key] = value;
  }
  
  /**
   * Schedules a new update (if none already scheduled)
   */
  _scheduleUpdate() {
    if (this._timer) {
      // already scheduled update
      return;
    }
    
    // schedule a new update
    this._timer = setTimeout(this._executeUpdate, DefaultUpdateDelay);
  }

  /**
   * actually update by calling all relevant listeners
   */
  _executeUpdate = () => {
    // get previous results
    const listeners = this._scheduledListeners;
    const changed = this._changed;
    
    // reset everything
    this._timer = null;
    this._scheduledListeners = [];
    this._changed = {};
    
    // call all affected listeners
    listeners.forEach(l => l(changed));
    this._updateListeners.forEach(l => l(changed));
  }
}

export default State;