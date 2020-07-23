import PlaybackController from './PlaybackController';

/**
 * @type {PlaybackController}
 */
let playbackController;

export function initPlayback() {
  playbackController = new PlaybackController();
  return playbackController;
}

export default playbackController;