import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '@/util/domUtil';

class Toolbar extends ClientComponentEndpoint {
  // ###########################################################################
  // createEl
  // ###########################################################################

  createEl() {
    // return compileHtmlElement(/*html*/`<div></div>`);
    return compileHtmlElement(/*html*/`
      <nav class="navbar sticky-top navbar-expand-lg navbar-light bg-light" id="toolbar">
        <!-- TODO: remove? -->
        <!-- <a data-el="switchModeBtn" class="btn btn-info" href="#"></a> -->
        <a data-el="syncModeBtn" class="btn btn-info" href="#"></a>
        <a data-el="restartBtn" class="btn btn-danger" href="#">⚠️Restart⚠️</a>
      </nav>
    `);
  }

  // ###########################################################################
  // update
  // ###########################################################################

  update = () => {
    const { traceModeName, syncMode } = this.state;
    this.els.switchModeBtn.textContent = `${traceModeName}`;
    this.els.syncModeBtn.textContent = syncMode ? 'Sync: 🟢' : 'Sync: 🔴';
  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  on = {
    switchModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.remote.switchTraceMode();
      }
    },

    restartBtn: {
      async click(evt) {
        evt.preventDefault();

        if (await this.app.confirm('Do you really want to restart?')) {
          this.remote.restart();
        }
      }
    },

    syncModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.remote.toggleSyncMode();
      }
    }
  }
}

export default Toolbar;