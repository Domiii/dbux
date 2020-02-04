import PlaybackController from "./PlaybackController";

import DataProvider from "dbux-data/src/DataProvider";
import { TreeViewController } from "../treeView/treeViewController";

import { commands } from 'vscode';

let playbackController: PlaybackController;

export function initPlayback(dataProvider: DataProvider, treeViewController:TreeViewController){
  commands.executeCommand('setContext', 'dbuxPlaybackPlaying', false);
  playbackController = new PlaybackController(dataProvider, treeViewController);
  return playbackController;
}