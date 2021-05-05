import ProjectsManager from './ProjectsManager';
import { installHackfixes } from './shelljs_hackfixes';

export function initDbuxProjects(cfg, externals) {
  installHackfixes();

  if (cfg || externals) {
    const manager = new ProjectsManager(cfg, externals);
    return manager;
  }
  return null;
}
