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
        <a data-el="switchModeBtn" class="btn btn-info" href="#"></a>
        <a data-el="syncMoveBtn" class="btn" href="#"></a>
        <a data-el="restartBtn" class="btn btn-danger" href="#">⚠️Restart⚠️</a>
      </nav>
    `);
  }

  // ###########################################################################
  // update
  // ###########################################################################

  update = () => {
    const { traceModeName } = this.state;
    this.els.switchModeBtn.textContent = `${traceModeName}`;
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
    syncMoveBtn: {
      click(evt) {
        evt.preventDefault();
        this.remote.reSyncMode();
      }
    }
  }
}

export default Toolbar;