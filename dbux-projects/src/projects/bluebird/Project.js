import Project from '../../projectLib/Project';


/**
 * TODO:
 * * `js` folder is ignored, so search leads you to the "incorrect" (i.e. unused) `src` folder
 */
export default class BluebirdProject extends Project {
  gitRemote = 'petkaantonov/bluebird.git';
  gitCommit = 'tags/v3.7.2'

  packageManager = 'yarn';

  loadBugs() {
    return [
      {
        label: 'basic example1',
        testFilePaths: ['example1.js']
      },
      {
        label: 'error1',
        testFilePaths: ['error1.js']
      }
    ];
  }

  decorateBugForRun(bug) {
    Object.assign(bug, {
      dbuxArgs: '--pw=.*'
    });
  }
}