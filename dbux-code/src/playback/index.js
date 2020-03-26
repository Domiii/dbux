import { commands } from 'vscode';
import PlaybackController from './PlaybackController';

let playbackController: PlaybackController;

export function initPlayback() {
  commands.executeCommand('setContext', 'dbuxPlayback.context.playing', false);
  playbackController = new PlaybackController();
  return playbackController;
}