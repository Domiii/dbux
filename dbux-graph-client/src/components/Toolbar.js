import { compileHtmlElement, decorateClasses, decorateAttr } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class Toolbar extends ClientComponentEndpoint {
  // ###########################################################################
  // createEl
  // ###########################################################################

  createEl() {
    // return compileHtmlElement(/*html*/`<div></div>`);
    return compileHtmlElement(/*html*/`
      <nav class="navbar fixed-top navbar-expand-lg navbar-light bg-light no-padding" id="toolbar">
        <!--a data-el="switchModeBtn" class="btn btn-info hidden" href="#"></a-->
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
          <a data-el="syncModeBtn" class="btn btn-info" href="#">sync</a>
          <a data-el="locModeBtn" class="btn btn-info" href="#">loc</a>
          <a data-el="callModeBtn" class="btn btn-info" href="#">call</a>
          <a data-el="valueModeBtn" class="btn btn-info" href="#">val</a>
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
    const { 
      syncMode,
      locMode,
      callMode,
      valueMode,
      thinMode
    } = this.state;
    // this.els.switchModeBtn.textContent = `${traceModeName}`;
    // this.els.syncModeBtn.textContent = `Sync: ${syncMode ? '✅' : '❌'}`;

    // render buttons
    decorateClasses(this.els.syncModeBtn, {
      active: syncMode
    });
    decorateClasses(this.els.locModeBtn, {
      active: locMode
    });
    decorateClasses(this.els.callModeBtn, {
      active: callMode
    });
    decorateClasses(this.els.valueModeBtn, {
      active: valueMode
    });
    decorateClasses(this.els.thinModeBtn, {
      active: thinMode
    });
    this.els.thinModeBtn.innerHTML = `${!!thinMode && '||&nbsp;' || '|&nbsp;|'}`;


    this.renderModes();
  }

  renderModes() {
    const {
      locMode,
      callMode,
      valueMode,
      thinMode
    } = this.state;

    const docEl = this.context.graphDocument.el;
    decorateClasses(docEl, {
      'hide-locs': !locMode,
      'hide-values': !valueMode,
      'thin-mode': thinMode
    });

    decorateAttr(docEl, {
      'data-call-mode': callMode && 1 || 0
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

    locModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.setState({
          locMode: !this.state.locMode
        });
      },
      focus(evt) { evt.target.blur(); }
    },

    callModeBtn: {
      click(evt) {
        evt.preventDefault();
        evt.target.blur();
        
        this.setState({
          callMode: !this.state.callMode
        });
      },
      // focus(evt) { evt.target.blur(); }
    },

    valueModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.setState({
          valueMode: !this.state.valueMode
        });
      },
      focus(evt) { evt.target.blur(); }
    },

    thinModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.setState({
          thinMode: !this.state.thinMode
        });
      },
      focus(evt) { evt.target.blur(); }
    },
  }
}

export default Toolbar;