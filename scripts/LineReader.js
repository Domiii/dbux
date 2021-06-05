const readline = require('readline');

class LineReader {
  _nextLinePromise;
  _nextLineResolve;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });

    this._nextLine();
    this.rl.on('line', this._handleLine);
  }

  async readLine(text = '') {
    this.rl.prompt(text);
    return this._nextLinePromise;
  }

  _nextLine() {
    this._nextLinePromise = new Promise(r => {
      this._nextLineResolve = r;
    });
  }

  _handleLine = (line) => {
    this._nextLineResolve(line);
    this._nextLine();
  }
}

module.exports = LineReader;