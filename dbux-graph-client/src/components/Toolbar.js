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
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
          <button data-el="hideNewRunBtn" class="btn btn-info" href="#"></button>
          <button data-el="hideOldRunBtn" class="btn btn-info" href="#">x</button>
          <button data-el="syncModeBtn" class="btn btn-info" href="#">sync</button>
          <button data-el="locModeBtn" class="btn btn-info" href="#">loc</button>
          <button data-el="callModeBtn" class="btn btn-info" href="#">call</button>
          <button data-el="valueModeBtn" class="btn btn-info" href="#">val</button>
          <button data-el="thinModeBtn" class="no-horizontal-padding btn btn-info" href="#"></button>
        </div>
        <button data-el="restartBtn" class="btn btn-danger" href="#">⚠️Restart⚠️</button>
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
      thinMode,
      hideOldMode,
      hideNewMode
    } = this.state;

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
    decorateClasses(this.els.hideOldRunBtn, {
      active: hideOldMode
    });
    decorateClasses(this.els.hideNewRunBtn, {
      active: !hideNewMode
    });
    this.els.thinModeBtn.innerHTML = `${!!thinMode && '||&nbsp;' || '|&nbsp;|'}`;
    this.els.hideNewRunBtn.innerHTML = `${hideNewMode ? '⚪' : '🔴'}`;

    
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

    hideOldRunBtn: {
      click(evt) {
        evt.preventDefault();
        const mode = !this.state.hideOldMode;
        this.remote.hideOldRun(mode && Date.now());
      },
      focus(evt) { evt.target.blur(); }
    },

    hideNewRunBtn: {
      click(evt) {
        evt.preventDefault();
        const mode = !this.state.hideNewMode;
        this.remote.hideNewRun(mode && Date.now());
      },
      focus(evt) { evt.target.blur(); }
    },
  }
}

export default Toolbar;