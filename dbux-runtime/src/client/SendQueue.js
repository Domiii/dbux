class SendQueue {
  client;
  buffers;
  timer;

  constructor(client) {
    this.client = client;

    this.clear();
  }

  clear() {
    this.buffers = {};
    this.timer = null;
    this.empty = true;
  }

  send(dataName, data) {
    this.empty = false;
    const buffer = (this.buffers[dataName] = this.buffers[dataName] || []);
    buffer.push(data);

    this._flushLater();
  }

  sendAll(dataName, data) {
    this.empty = false;
    const buffer = (this.buffers[dataName] = this.buffers[dataName] || []);
    buffer.push(...data);

    this._flushLater();
  }

  _flushLater() {
    if (!this.timer) {
      this.timer = Promise.resolve().then(() => this.flush());
    }
  }

  /**
   * Send all buffered data right now
   */
  flush = () => {
    this.timer = null;
    if (this.client.sendNow(this.buffers)) {
      this.clear();
    }
  }
}

export default SendQueue;