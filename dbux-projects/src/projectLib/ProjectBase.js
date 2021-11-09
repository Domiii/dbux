
export default class ProjectBase {
  // ###########################################################################
  // config
  // ###########################################################################

  /**
   * Provided for each individual project.
   */
  gitRemote;

  /**
   * Branch or tag name.
   * Uses `git clone --branch`, instead of the default branch.
   * This seems to be an old feature, supported since 2008.
   * 
   * @see https://git-scm.com/docs/git-clone#Documentation/git-clone.txt---branchltnamegt
   * @see https://lore.kernel.org/git/211101.865ytc3qaw.gmgdl@evledraar.gmail.com/T/#t
   */
  gitTargetRef;

  /**
   * A specific commit hash or tag name to refer to (if wanted)
   * Use `#gitTargetRef` instead.
   * If you use this, things might slow down a lot, 
   * since the repository must get cloned before this commit can be checked out.
   */
  gitCommit;

  nodeVersion;
  packageManager;

  // loadBugs() {}
  // decorateExerciseForRun() {}
  // makeBuilder() {}
  // afterInstall() {}
}
