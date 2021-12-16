import { showInformationMessage } from '../../codeUtil/codeModals';
import { runTaskWithProgressBar } from '../../codeUtil/runTaskWithProgressBar';

/** @typedef {import('@dbux/projects/src/projectLib/Project').default} Project */
/** @typedef {import('./ProjectNodeProvider').default} ProjectNodeProvider */

/**
 * @param {ProjectNodeProvider} treeNodeProvider 
 * @param {Project} project 
 */
export default async function cleanUp(treeNodeProvider, project) {
  const confirmMessage = `How do you want to clean up the project: ${project.name}?`;
  const btnConfig = {
    "Flush Cache Only": async () => {
      await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
        progress.report({ message: 'deleting cache folder...' });
        project.deleteCacheFolder();
      }, {
        cancellable: false,
        title: project.name,
      });

      treeNodeProvider.refresh();
      showInformationMessage('Cache flushed successfully.');
    },
    "Clear Log Files": async () => {
      // TODO: better explain this
      await project.clearLog();
      showInformationMessage('Log files removed successfully.');
    },
    "Delete Project (+ Cache)": async () => {
      const success = await runTaskWithProgressBar(async (progress/* , cancelToken */) => {
        progress.report({ message: 'deleting project folder...' });

        return await project.deleteProjectFolder();
      }, {
        cancellable: false,
        title: project.name,
      });

      if (success) {
        treeNodeProvider.refresh();
        await showInformationMessage('Project has been deleted successfully.');
      }
    }
  };
  await showInformationMessage(confirmMessage, btnConfig, { modal: true });
}