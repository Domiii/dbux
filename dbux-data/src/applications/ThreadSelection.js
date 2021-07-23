import NanoEvents from 'nanoevents';

class Thread {
  /**
   * @type {number}
   */
  applicationId;
  /**
   * @type {number}
   */
  threadId;
}

export class ThreadSelection {
  constructor() {
    this._emitter = new NanoEvents();
    this.selected = new Set();
    this._isActive = false;
  }

  /**
   * @param {[Thread]} threads 
   * @param {string} [sender] 
   */
  select(threads, sender = null) {
    if (threads) {
      this._isActive = true;
      threads.forEach((thread) => this._addOne(thread));
    }
    else {
      this._isActive = false;
    }
    this._emitSelectionChangedEvent(sender);
  }

  disable() {
    this.selected.clear();
    this._isActive = false;
  }

  isActive() {
    return this._isActive;
  }

  /**
   * @param {Thread} thread 
   */
  isSelected(thread) {
    return this.selected.has(this._makeKey(thread));
  }

  _addOne(thread) {
    this.selected.add(this._makeKey(thread));
  }

  _makeKey({ applicationId, threadId }) {
    return `${applicationId}_${threadId}`;
  }

  _emitSelectionChangedEvent(sender = null) {
    this._emitter.emit('selectionChanged', sender);
  }

  onSelectionChanged(cb) {
    return this._emitter.on('selectionChanged', cb);
  }
}

const threadSelection = new ThreadSelection();
export default threadSelection;
