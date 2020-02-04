class SendQueue {
  client;
  buffers = {};
  timer;

  constructor(client) {
    this.client = client;
  }

  clear() {
    this.buffers = {};
    this.timer = null;
  }

  send(dataName, data) {
    const buffer = (this.buffers[dataName] = this.buffers[dataName] || []);
    buffer.push(data);

    this._flushLater();
  }

  sendAll(dataName, data) {
    const buffer = (this.buffers[dataName] = this.buffers[dataName] || []);
    buffer.push(...data);

    this._flushLater();
  }

  _flushLater() {
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush());
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