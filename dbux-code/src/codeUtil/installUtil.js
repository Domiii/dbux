import { newLogger } from '@dbux/common/src/log/logger';
import { getOrCreateProjectManager } from '../projectView/projectControl';
import { showOutputChannel } from '../projectView/projectViewController';
import { runTaskWithProgressBar } from './runTaskWithProgressBar';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DBUX run file');


export async function installDbuxDependencies() {
  const projectManager = getOrCreateProjectManager();
  // log('installing dependencies. installed:', projectManager.hasInstalledSharedDependencies());

  if (projectManager.isInstallingSharedDependencies()) {
    throw new Error('Busy installing. This happens after extension installation (or update). This might (or might not) take a few minutes.');
  }
  if (!projectManager.hasInstalledSharedDependencies()) {
    await runTaskWithProgressBar(async (progress) => {
      showOutputChannel();
      progress.report({ message: 'Installing Dbux dependencies (1-2 mins)...' });
      await projectManager.installDependencies();
    }, { cancellable: false });
  }
}