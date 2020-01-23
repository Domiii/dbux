import PlaybackController from "./PlaybackController";

import DataProvider from "dbux-data/src/DataProvider";
import { TreeViewController } from "../treeView/treeViewController";

let playbackController: PlaybackController;

export function initPlayback(dataProvider: DataProvider, treeViewController:TreeViewController){
  playbackController = new PlaybackController(dataProvider, treeViewController);
  return playbackController;
}