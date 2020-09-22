import { window } from 'vscode';
import strip from 'strip-color';

export default class OutputChannel {
  constructor(name) {
    this._channel = window.createOutputChannel(name);
  }

  log(...args) {
    this._channel.appendLine(args.map(s => strip(String(s))).join(' '));
  }

  show(preserveFocus = false) {
    this._channel.show({ preserveFocus });
  }

  hide() {
    this._channel.hide();
  }

  clear() {
    this._channel.clear();
  }
}