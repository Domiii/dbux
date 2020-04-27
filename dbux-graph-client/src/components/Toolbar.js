import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '@/util/domUtil';

class Toolbar extends ClientComponentEndpoint {
  // ###########################################################################
  // createEl
  // ###########################################################################

  createEl() {
    return compileHtmlElement(/*html*/`
      <nav class="navbar sticky-top navbar-expand-lg navbar-light bg-light" id="toolbar">
        <a data-el="hiBtn" class="btn btn-info" href="#"></a>
        <a data-el="switchModeBtn" class="btn btn-info" href="#"></a>
        <a data-el="restartBtn" class="btn btn-danger" href="#">⚠️Restart⚠️</a>
      </nav>
    `);
  }

  // ###########################################################################
  // update
  // ###########################################################################

  update = () => {
    const { count, traceModeName } = this.state;
    this.els.hiBtn.textContent = `hi! (${count})`;
    this.els.switchModeBtn.textContent = `${traceModeName}`;
  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  on = {
    hiBtn: {
      click(evt) {
        evt.preventDefault();
        this.remote.addHi(3);
      },

      focus(evt) {
        evt.preventDefault();
        evt.target.blur();
      }
    },

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
    }
  }
}

export default Toolbar;