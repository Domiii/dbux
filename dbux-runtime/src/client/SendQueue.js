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
  }

  sendAll(dataName, data) {
    const buffer = (this.buffers[dataName] = this.buffers[dataName] || []);
    buffer.push(...data);
  }

  _scheduleFlush() {
    if (!this.timer) {
      this.timer = setImmediate(this.flush);
    }
  }

  /**
   * Send all buffered data right now
   */
  flush = () => {
    this.client.sendNow(this.buffers);
    this.clear();
  }
}

export default SendQueue;