import ProjectsManager from './ProjectsManager';
import { installHackfixes } from './shelljs_hackfixes';

export async function initDbuxProjects(cfg, externals) {
  installHackfixes();

  if (cfg || externals) {
    const manager = new ProjectsManager(cfg, externals);
    await manager.init();
    return manager;
  }
  return null;
}

export {
  ProjectsManager
};