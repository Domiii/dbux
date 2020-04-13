import path from 'path';

export default class Bug {
  project;
  
  mainFilePath;
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
    const fpath = path.join(this.project.projectPath, this.mainFilePath);
    return this.manager.editor.openFolder(fpath);
  }
}