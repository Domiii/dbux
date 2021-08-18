
export default class ProjectBase {
  // ###########################################################################
  // config
  // ###########################################################################

  /**
   * Provided for each individual project.
   */
  gitRemote;

  /**
   * A specific commit hash or tag name to refer to (if wanted)
   */
  gitCommit;


  nodeVersion;

  packageManager;

  // loadBugs() {}
  // decorateBug() {}
  // makeBuilder() {}
}
