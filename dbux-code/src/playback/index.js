import { commands } from 'vscode';
import { TreeViewController } from '../treeView/treeViewController';
import PlaybackController from './PlaybackController';

let playbackController: PlaybackController;

export function initPlayback(treeViewController: TreeViewController) {
  commands.executeCommand('setContext', 'dbuxPlaybackPlaying', false);
  playbackController = new PlaybackController(treeViewController);
  return playbackController;
}