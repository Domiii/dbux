import lockfile from 'lockfile';
import { newLogger } from '@dbux/common/src/log/logger';
import { getOrCreateProjectManager } from '../projectView/projectControl';
import { showOutputChannel } from '../projectView/projectViewController';
import { runTaskWithProgressBar } from './runTaskWithProgressBar';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('installUtil');

let _extensionContext;

export function initInstallUtil(extensionContext) {
  _extensionContext = extensionContext;
}


export async function installDbuxDependencies() {
  const projectManager = getOrCreateProjectManager();
  debug('installing dependencies - installed:', projectManager.hasInstalledSharedDependencies());

  if (projectManager.isInstallingSharedDependencies()) {
    throw new Error('Busy installing. This happens after extension installation (or update). This might (or might not) take a few minutes.');
  }
  if (!projectManager.hasInstalledSharedDependencies()) {
    await runTaskWithProgressBar(async (progress) => {
      // showOutputChannel();
      progress.report({ message: 'New version. Installing deps (1-3 mins)...' });

      debug('install: obtaining file lock');

      let lockfilePath = _extensionContext.asAbsolutePath('install.lock');
      await new Promise((resolve, reject) => {
        lockfile.lock(lockfilePath, { wait: 10 ** 9 }, (err) => {
          if (err) {
            reject(err);
          }
          else {
            resolve();
          }
        });
      });
      if (!projectManager.hasInstalledSharedDependencies()) {
        debug('installing...');
        await projectManager.installDependencies();
      }
      else {
        debug('install: skipped');
      }
      lockfile.unlockSync(lockfilePath);

      debug('install: finished');
    }, { cancellable: false });
  }
}