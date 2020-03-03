import { commands } from 'vscode';
import { ContextViewController } from '../contextView/contextViewController';
import PlaybackController from './PlaybackController';

let playbackController: PlaybackController;

export function initPlayback() {
  commands.executeCommand('setContext', 'dbuxPlaybackPlaying', false);
  playbackController = new PlaybackController();
  return playbackController;
}