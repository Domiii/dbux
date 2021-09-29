import Project from '../../projectLib/Project';


export default class AsyncJsProject extends Project {
  gitRemote = 'caolan/async.git';
  gitCommit = 'tags/v3.2.1'
  packageManager = 'yarn';

  loadBugs() {
    return [
      {
        label: 'queue bug',
        testFilePaths: ['bug1.js']
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
}