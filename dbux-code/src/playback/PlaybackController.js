import { commands } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import { newLogger } from '@dbux/common/src/log/logger';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import tracePlayback from '@dbux/data/src/playback/tracePlayback';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PlaybackController');

export default class PlaybackController {
  constructor() {
    tracePlayback.onPause(this.handlePause);

    commands.executeCommand('setContext', 'dbuxPlayback.context.playing', false);
  }

  // ###########################################################################
  // Play functions
  // ###########################################################################

  play = () => {
    commands.executeCommand('setContext', 'dbuxPlayback.context.playing', true);
    tracePlayback.play();
    this.printTracesInfo();
    this.printContextsInfo();
  }

  pause = () => {
    commands.executeCommand('setContext', 'dbuxPlayback.context.playing', false);
    tracePlayback.pause();
  }

  previousTrace = () => {
    tracePlayback.gotoPreviousTrace();
  }

  nextTrace = () => {
    tracePlayback.gotoNextTrace();
  }

  // ###########################################################################
  // Events
  // ###########################################################################

  handlePause() {
    commands.executeCommand('setContext', 'dbuxPlayback.context.playing', false);
  }
}
