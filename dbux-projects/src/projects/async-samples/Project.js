import Project from '../../projectLib/Project';


export default class AsyncSamples extends Project {
  decorateExercise(config) {
    Object.assign(config, {
      // dbuxArgs: '--pw=.* --esnext'
      dbuxArgs: ''
    });
    return config;
  }

  async isGitInitialized() {
    return this.doesProjectGitFolderExist() &&

      /**
       * Check if HEAD already exists
       * @see https://stackoverflow.com/questions/18515488/how-to-check-if-the-commit-exists-in-a-git-repository-by-its-sha-1
       */
      !await this.exec(`"${this.manager.paths.git}" cat-file -e HEAD`, {
        failOnStatusCode: false
      });
  } 
}