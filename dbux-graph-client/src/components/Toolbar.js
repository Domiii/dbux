import { compileHtmlElement, decorateClasses, decorateAttr } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
let documentClickHandler;

class Toolbar extends ClientComponentEndpoint {
  // ###########################################################################
  // createEl
  // ###########################################################################
  createEl() {
    const backgroundMode = 'dark';
    // return compileHtmlElement(/*html*/`<div></div>`);
    return compileHtmlElement(/*html*/`
      <nav class="navbar fixed-top navbar-expand-lg navbar-${backgroundMode} bg-${backgroundMode} no-padding" id="toolbar">
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
          <button title="Stop recording: Do not add new runs/traces" data-el="hideNewRunBtn" class="btn btn-info" href="#"></button>
          <button title="Clear: Hide all existing runs/traces" data-el="hideOldRunBtn" class="btn btn-info" href="#">x</button>
          <button title="Sync and always lock onto selected trace" data-el="syncModeBtn" class="btn btn-info" href="#">sync</button>
          <button title="Show location of context (function declaration or start of file)" data-el="locModeBtn" class="btn btn-info" href="#">loc</button>
          <button title="Show caller (call trace) of function call" data-el="callModeBtn" class="btn btn-info" href="#">call</button>
          <button title="Show arguments and return value of function call in the form of: (args) -> returnValue" data-el="valueModeBtn" class="btn btn-info" href="#">val</button>
          <button title="Thin mode" data-el="thinModeBtn" class="no-horizontal-padding btn btn-info" href="#"></button>
          <button title="Search for contexts by name" data-el="searchBtn" class="btn btn-info" href="#">🔍</button>
        </div>
        <div data-el="moreMenu" class="dropdown">
          <button data-el="moreMenuBtn" class="btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            ☰
          </button>
          <div data-el="moreMenuBody" class="dropdown-menu" 
          style="left: inherit; right: 0; min-width: 0;"
          aria-labelledby="dropdownMenuButton">
            <!--button data-el="showIdsBtn" class="btn btn-info full-width" href="#">ids</button-->
            <div class="dropdown-divider"></div>
            <button title="Restart the Webview (can eliviate some bugs)" data-el="restartBtn" class="btn btn-danger full-width" href="#">Restart</button>
          </div>
        </div>
      </nav>
    `);
  }

  setupEl() {
    this.dropDownOpen = false;
    if (documentClickHandler) {
      document.removeEventListener('click', documentClickHandler);
    }
    document.addEventListener('click', documentClickHandler = this._onDocumentClick);
  }

  _onDocumentClick = (evt) => {
    const btn = this.els.moreMenuBtn;
    if (evt.target !== btn && this.dropDownOpen) {
      this.toggleMenu();
    }
  };

  toggleMenu() {
    this.dropDownOpen = !this.dropDownOpen;
    if (this.dropDownOpen) {
      this.els.moreMenuBody.style.display = 'inherit';
    }
    else {
      this.els.moreMenuBody.style.display = 'none';
    }
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
      hideNewMode,
      searchTerm,
      backgroundMode
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
    decorateClasses(this.els.searchBtn, {
      active: !!searchTerm
    });
    this.el.classList.remove('navbar-dark navbar-light bg-dark bg-light');
    this.el.classList.add(`navbar-${backgroundMode} bg-${backgroundMode}`);
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
          this.componentManager.restart();
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

    searchBtn: {
      async click(evt) {
        evt.preventDefault();
        if (this.state.searchTerm) {
          // stop searching
          await this.remote.search(null);
        }
        else {
          // start searching
          const searchTerm = await this.app.prompt('Enter search term');
          if (searchTerm) {
            await this.remote.search(searchTerm);
          }
        }
      },
      focus(evt) { evt.target.blur(); }
    },

    moreMenuBtn: {
      click(/* evt */) {
        this.toggleMenu();
      },
      focus(evt) { evt.target.blur(); }
    }
  }
}

export default Toolbar;