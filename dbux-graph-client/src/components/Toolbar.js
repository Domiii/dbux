import { compileHtmlElement, decorateClasses } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class Toolbar extends ClientComponentEndpoint {
  // ###########################################################################
  // createEl
  // ###########################################################################

  createEl() {
    // return compileHtmlElement(/*html*/`<div></div>`);
    return compileHtmlElement(/*html*/`
      <nav class="navbar fixed-top navbar-expand-lg navbar-light bg-light" id="toolbar">
        <!--a data-el="switchModeBtn" class="btn btn-info hidden" href="#"></a-->
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
          <a data-el="syncModeBtn" class="btn btn-info" href="#"></a>
          <a data-el="thinModeBtn" class="no-horizontal-padding btn btn-info" href="#"></a>
        </div>
        <a data-el="restartBtn" class="btn btn-danger" href="#">⚠️Restart⚠️</a>
      </nav>
    `);
  }

  // ###########################################################################
  // update
  // ###########################################################################

  update = () => {
    const { traceModeName, syncMode } = this.state;
    // this.els.switchModeBtn.textContent = `${traceModeName}`;
    // this.els.syncModeBtn.textContent = `Sync: ${syncMode ? '✅' : '❌'}`;

    this.els.syncModeBtn.textContent = 'Sync';

    decorateClasses(this.els.syncModeBtn, {
      active: syncMode
    });


    this.renderThinMode();
  }

  renderThinMode() {
    // re-render thin mode (NOTE: does not go through host/state)
    const { thinMode } = this;
    this.els.thinModeBtn.innerHTML = `${!!thinMode && '||&nbsp;' || '|&nbsp;|'}`;
    const docEl = this.context.graphDocument.el;
    decorateClasses(docEl, {
      'thin-mode': thinMode
    });

  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  on = {
    // switchModeBtn: {
    //   click(evt) {
    //     evt.preventDefault();
    //     this.remote.switchTraceMode();
    //   }
    // },

    restartBtn: {
      async click(evt) {
        evt.preventDefault();

        if (await this.app.confirm('Do you really want to restart?')) {
          this.remote.restart();
        }
      },

      focus(evt) { evt.target.blur(); }
    },

    syncModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.remote.toggleSyncMode();
      },

      focus(evt) { evt.target.blur(); }
    },

    thinModeBtn: {
      click(evt) {
        evt.preventDefault();
        
        this.thinMode = !this.thinMode;
        this.renderThinMode();
      },
      
      focus(evt) { evt.target.blur(); }
    }
  }
}

export default Toolbar;