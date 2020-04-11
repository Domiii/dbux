import ProjectsManager from './ProjectsManager';

(async function main() {
  const externals = {
    
  };
  const manager = new ProjectsManager({
    externals
  });
  const projects = manager.buildDefaultProjectList();
  const runner = manager.newBugRunner();
  const project1 = projects.getAt(0);
  const bug = project1.bugs.getAt(0);
  
  runner.activateBug(bug);
  bug.openEditor();
})();