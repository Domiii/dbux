import path from 'path';

export default class Bug {
  project;
  
  testFilePaths;
  id;
  title;
  description;

  /**
   * Can be used to provide even more information about the bug.
   * E.g. BugsJs provides discussion logs of developers revolving around the bug.
   */
  moreDetails;

  hints; // TODO
  difficulty; // TODO!

  constructor(project, cfg) {
    Object.assign(this, cfg);
    this.project = project;
  }

  get manager() {
    return this.project.manager;
  }

  async openInEditor() {
    // add folder to IDE
    await this.manager.externals.editor.openFolder(this.project.projectPath);

    // open file (if any)
    if (this.testFilePaths[0]) {
      const fpath = path.join(this.project.projectPath, this.testFilePaths[0]);
      await this.manager.externals.editor.openFolder(fpath);
    }
  }
}