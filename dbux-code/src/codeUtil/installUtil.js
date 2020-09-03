import lockfile from 'lockfile';
import { newLogger } from '@dbux/common/src/log/logger';
import { getOrCreateProjectManager } from '../projectView/projectControl';
import { showOutputChannel } from '../projectView/projectViewController';
import { runTaskWithProgressBar } from './runTaskWithProgressBar';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('DBUX run file');


export async function installDbuxDependencies(extensionContext) {
  const projectManager = getOrCreateProjectManager();
  // log('installing dependencies. installed:', projectManager.hasInstalledSharedDependencies());

  if (projectManager.isInstallingSharedDependencies()) {
    throw new Error('Busy installing. This happens after extension installation (or update). This might (or might not) take a few minutes.');
  }
  if (!projectManager.hasInstalledSharedDependencies()) {
    await runTaskWithProgressBar(async (progress) => {
      showOutputChannel();
      progress.report({ message: 'New Dbux installation. Getting dependencies (1-3 mins)...' });

      let lockfilePath = extensionContext.asAbsolutePath('install.lock');
      lockfile.lockSync(lockfilePath);
      await projectManager.installDependencies();
      lockfile.unlockSync(lockfilePath);
    }, { cancellable: false });
  }
}