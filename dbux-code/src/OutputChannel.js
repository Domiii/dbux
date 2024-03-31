import { window } from 'vscode';
import strip from 'strip-color';
import { addOutputStreams } from '@dbux/common/src/log/logger';

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


const outputChannel = new OutputChannel('Dbux');

addOutputStreams({
  log: outputChannel.log.bind(outputChannel),
  warn: outputChannel.log.bind(outputChannel),
  error: outputChannel.log.bind(outputChannel),
  debug: outputChannel.log.bind(outputChannel)
}, true);

export function showOutputChannel() {
  outputChannel.show();
}
