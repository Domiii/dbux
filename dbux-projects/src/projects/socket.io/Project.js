import Project from '../../projectLib/Project';
// import { buildNodeCommand } from '../../util/nodeUtil';

/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */

/**
 * 
 */
export default class SocketIOProject extends Project {
  gitRemote = 'socketio/socket.io-client.git';

  /**
   * NOTE: They migrated to TS with v3, so we have to target v2.
   * 
   * @see https://github.com/socketio/socket.io-client/releases/tag/2.3.0
   * @see https://github.com/socketio/socket.io-client/tags?after=3.0.0-rc4
   * @see https://github.com/socketio/socket.io/tags?after=3.0.0-rc4
   */
  gitCommit = 'tags/2.3.0'

  packageManager = 'yarn';

  async npmInstall() {
    await this.execInTerminal('yarn install --prod');
  }

  canRunExercise(config) {
    return !!config.testFilePaths;
  }

  decorateExercise(config) {
    Object.assign(config, {
      dbuxArgs: '--pw=.* --esnext'
    });
    return config;
  }

  async afterInstall() {
    // install socket.io server so we can run the sample
    await this.installPackages({
      'socket.io': '2.3.0'
    });
  }
}