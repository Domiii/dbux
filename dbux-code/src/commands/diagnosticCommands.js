/* eslint-disable camelcase */
import { newLogger } from '@dbux/common/src/log/logger';
import { window } from 'vscode';
import { registerCommand } from './commandUtil';
import { alert, showInformationMessage, showQuickPick } from '../codeUtil/codeModals';
import { getAllMemento, clearAll } from '../memento';
import { renderValueAsJsonInEditor } from '../traceDetailsView/valueRender';
import { getProjectManager } from '../projectViews/projectControl';

const { log, debug, warn, error: logError } = newLogger('diagnosticCommands');

/** @typedef {import('../projectViews/projectViewsController').ProjectViewController} ProjectViewController */

/**
 * @param {ProjectViewController} projectViewController 
 */
export function initDiagnosticCommands(extensionContext) {
  registerCommand(extensionContext, 'dbux.diagnostics', async () => {
    const items = makeDiagnosticCommands(extensionContext);
    const result = await showQuickPick(items);
    if (result?.cb) {
      await result.cb();
    }
  });
}

/**
 * @param {ProjectViewController} projectViewController 
 */
function makeDiagnosticCommands(extensionContext) {
  return [
    /** ########################################
     * project stuff
     *  ######################################*/
    async function Exec_For_Project() {
      const project = getProjectManager()?.activeProject;
      if (!project) {
        throw new Error(`Cannot exec for project: no project active.`);
      }

      /**
       * @see https://code.visualstudio.com/api/references/vscode-api#InputBoxOptions
       */
      let cmd = await window.showInputBox({ 
        title: `[${project.name}] Provide a shell command to be executed in project's CWD.`,
        placeHolder: 'node -v'
      });
      if (cmd) {
        const result = await project.execCaptureAll(cmd, { failOnStatusCode: false, failWhenNotFound: false });
        const out = result.out ? `\n\nout: ${result.out}` : '';
        const err = result.err ? `\n\nerr: ${result.err}` : '';
        const other = (!out && !err) ? '(process has no output)' : '';
        await alert(`Executed: "${cmd}" (code: ${result.code})${out}${err}${other}`);
      }
    },

    /** ########################################
     * mementos
     *  ######################################*/
    async function Show_Memento() {
      return await renderValueAsJsonInEditor(getAllMemento());
    },

    async function Clear_Memento() {
      await clearAll();
      await showInformationMessage('Memento cleared. Please reload the window.');
    },

    /** ########################################
     * DB stats
     *  ######################################*/
    async function Show_DB_Stats() {
      return getProjectManager()?._backend.showDBStats();
    },

    async function Clear_DB_Stats() {
      return getProjectManager()?._backend.clearDBStats();
    }
  ];
}