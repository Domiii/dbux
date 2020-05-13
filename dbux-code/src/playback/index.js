import { commands } from 'vscode';
import PlaybackController from './PlaybackController';

let playbackController: PlaybackController;

export function initPlayback() {
  playbackController = new PlaybackController();
  return playbackController;
}

export default playbackController;