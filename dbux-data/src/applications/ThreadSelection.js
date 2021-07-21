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
    this.isActive = false;
  }

  /**
   * @param {[Thread]} threads 
   * @param {string} [sender] 
   */
  selectThreads(threads, sender = null) {
    if (threads) {
      this.isActive = true;
      this.selected.clear();
      threads.forEach((thread) => this._addOne(thread));
    }
    else {
      this.isActive = false;
    }
    this._emitSelectionChangedEvent(sender);
  }

  /**
   * 
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
