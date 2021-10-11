import Project from '../../projectLib/Project';


export default class AsyncJsProject extends Project {
  gitRemote = 'caolan/async.git';
  gitCommit = 'tags/v3.2.0'
  packageManager = 'yarn';

  loadBugs() {
    return [
      {
        id: 1,
        label: 'queue bug',
        testFilePaths: ['bug1.js'],
        bugLocations: [
          {
            file: 'lib/internal/queue.js',
            line: 127
          }
        ]
      },
      {
        id: 2,
        label: 'queue bug (fixed)',
        testFilePaths: ['bug1.js'],
        patch: 'bug1-fix',
      }
    ];
  }

  decorateBugForRun(bug) {
    if (!bug.testFilePaths) {
      // bug not fully configured yet
      return;
    }

    Object.assign(bug, {
      dbuxArgs: '--pw=.* --pb=@babel.* --esnext'
    });
  }
}