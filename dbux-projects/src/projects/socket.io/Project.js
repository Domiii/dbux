import Project from '../../projectLib/Project';
// import { buildNodeCommand } from '../../util/nodeUtil';


/**
 * TODO: not done. Missing server and example script.
 */
export default class SocketIOProject extends Project {
  gitRemote = 'socketio/socket.io-client.git';

  /**
   * NOTE: They migrated to TS with v3
   * @see https://github.com/socketio/socket.io-client/releases/tag/2.3.0
   * @see https://github.com/socketio/socket.io-client/tags?after=3.0.0-rc4
   * @see https://github.com/socketio/socket.io/tags?after=3.0.0-rc4
   */
  gitCommit = 'tags/2.3.0'

  packageManager = 'yarn';

  async npmInstall() {
    await this.execInTerminal('yarn install --prod');
  }

  loadBugs() {
    return [
      {
        label: 'basic example1',
        testFilePaths: ['example1.js']
      }
    ];
  }

  decorateBugForRun(bug) {
    if (!bug.testFilePaths) {
      // bug not fully configured yet
      return;
    }

    Object.assign(bug, {
      dbuxArgs: '--pw=.* --esnext'
    });
  }

  async afterInstall() {
    // install server so we can run the sample
    await this.installPackages('socket.io@2.3.0'); // express');
  }
}