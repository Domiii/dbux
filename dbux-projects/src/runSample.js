import { buildDefaultProjectList } from '@';

(async function main() {
  const projects = buildDefaultProjectList();
  const project1 = projects.getAt(0);

  const runner = new BugRunner();

  const bug = project1.bugs.getAt(0);
  runner.activateBug(bug);
  bug.openEditor();

  // TODO: need some sort of manager/authority/ConfigProvider to provide externals for `openEditor`
})();