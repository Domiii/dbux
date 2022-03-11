import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import GraphType, { getGraphTypeDisplayName } from '@dbux/graph-common/src/shared/GraphType';
import StackMode, { getStackModeDisplayName } from '@dbux/graph-common/src/shared/StackMode';
import SearchMode from '@dbux/graph-common/src/shared/SearchMode';
import { compileHtmlElement, decorateClasses, decorateAttr } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

let documentClickHandler;
const toolbarIconSize = '12px';

class Toolbar extends ClientComponentEndpoint {
  createEl() {
    const iconUri = this.context.graphDocument.state.toolbarIconUris;
    return compileHtmlElement(/*html*/`
      <nav class="navbar sticky-top navbar-expand-lg no-padding" id="toolbar">
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
          <button title="Toggle Async Graph Mode" data-el="graphModeBtn" class="toolbar-btn btn btn-info" href="#">async</button>
          <button title="Toggle Async Detail" data-el="asyncDetailModeBtn" class="toolbar-btn btn btn-info" href="#">detail</button>
          <button title="Toggle Async Stack" data-el="asyncStackBtn" class="toolbar-btn btn btn-info" href="#">stack</button>
          
          <button title="Show location of context (function declaration or start of file)" data-el="locModeBtn" class="toolbar-btn btn btn-info" href="#">loc</button>
          <button title="Show caller (call trace) of function call" data-el="callModeBtn" class="toolbar-btn btn btn-info" href="#">call</button>
          <button title="Show arguments and return value of function call in the form of: (args) -> returnValue" data-el="valueModeBtn" class="toolbar-btn btn btn-info" href="#">val</button>
          <button title="Thin mode" data-el="thinModeBtn" class="toolbar-btn btn btn-info" href="#"></button>
          <div data-el="contextFilterMenu" class="dropdown btn-info">
            <button data-el="contextFilterMenuBtn" type="button" class="toolbar-btn btn btn-info dropdown-toggle" aria-haspopup="true" aria-expanded="false">
              <img width="${toolbarIconSize}" src="${iconUri.contextFilter}" />
            </button>
            <div data-el="contextFilterMenuBody" class="dropdown-menu">
              <button title="Filter context with package whitelist" data-el="packageWhitelistBtn" class="full-width toolbar-btn btn btn-info" href="#">Package whitelist</button>
              <button title="Filter context with package blacklist" data-el="packageBlacklistBtn" class="full-width toolbar-btn btn btn-info" href="#">Package blacklist</button>
            </div>
          </div>
          <div data-el="searchMenu" class="btn-group">
            <button data-el="searchMenuBtn" type="button" class="toolbar-btn btn btn-info" aria-haspopup="true" aria-expanded="false">
              🔍
            </button>
            <button data-el="searchMenuToggleBtn" type="button" class="toolbar-btn btn btn-info dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span class="sr-only">Toggle Dropdown</span>
            </button>
            <div data-el="searchMenuBody" class="dropdown-menu">
              <button title="Search for contexts by name" data-el="searchContextsBtn" class="full-width toolbar-btn btn btn-info" href="#">Search by context</button>
              <button title="Search for traces by name" data-el="searchTracesBtn" class="full-width toolbar-btn btn btn-info" href="#">Search by trace</button>
              <button title="Search for traces by value" data-el="searchValuesBtn" class="full-width toolbar-btn btn btn-info" href="#">Search by value</button>
            </div>
          </div>
          <button title="Sync and always lock onto selected trace" data-el="followModeBtn" class="toolbar-btn btn btn-info" href="#">follow</button>
          <button title="Stop recording: Do not add new runs/traces" data-el="hideNewRunBtn" class="toolbar-btn btn btn-info" href="#"></button>
          <button title="Clear: Hide all existing runs/traces" data-el="hideOldRunBtn" class="toolbar-btn btn btn-info" href="#">x</button>

          <button title="Clear Thread Selection" data-el="clearThreadSelectionBtn" class="toolbar-btn btn btn-info" href="#">
            <img width="${toolbarIconSize}" src="${iconUri.theradSelection}" />
          </button>
        </div>
        <div data-el="moreMenu" class="dropdown">
          <button data-el="mainMenuBtn" class="toolbar-btn btn btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            ☰
          </button>
          <div data-el="moreMenuBody" class="dropdown-menu" 
          style="left: inherit; right: 0; min-width: 0;"
          aria-labelledby="dropdownMenuButton">
            <!--button data-el="showIdsBtn" class="toolbar-btn btn btn-info full-width" href="#">ids</button-->
            <button title="Toggle context stats" data-el="statsBtn" class="toolbar-btn btn btn-info full-width" href="#">stats</button>
            <div class="dropdown-divider"></div>
            <button title="Restart the Webview (can eliviate some bugs)" data-el="restartBtn" class="toolbar-btn btn btn-danger full-width" href="#">Restart</button>
          </div>
        </div>
      </nav>
    `);
  }

  get searchBar() {
    return this.context.graphDocument.children.getComponent('SearchBar');
  }

  setupEl() {
    this.dropDownOpen = false;
    if (documentClickHandler) {
      document.removeEventListener('click', documentClickHandler);
    }
    document.addEventListener('click', documentClickHandler = this._onDocumentClick);
  }

  _onDocumentClick = (evt) => {
    const { searchMenuBtn, searchMenuToggleBtn, mainMenuBtn, contextFilterMenuBtn } = this.els;
    if (evt.target !== mainMenuBtn && this.dropDownOpen) {
      this.toggleMainMenu();
    }

    if ((evt.target !== searchMenuBtn && evt.target !== searchMenuToggleBtn) && this.searchMenuOpen) {
      this.toggleSearchMenu();
    }

    if (evt.target !== contextFilterMenuBtn && this.contextFilterMenuOpen) {
      this.toggleContextFilterMenu();
    }
  };

  toggleMainMenu() {
    this.dropDownOpen = !this.dropDownOpen;
    if (this.dropDownOpen) {
      this.els.moreMenuBody.style.display = 'inherit';
    }
    else {
      this.els.moreMenuBody.style.display = 'none';
    }
  }

  toggleContextFilterMenu() {
    this.contextFilterMenuOpen = !this.contextFilterMenuOpen;
    if (this.contextFilterMenuOpen) {
      this.els.contextFilterMenuBody.style.display = 'inherit';
    }
    else {
      this.els.contextFilterMenuBody.style.display = 'none';
    }
  }

  toggleSearchMenu() {
    this.searchMenuOpen = !this.searchMenuOpen;
    if (this.searchMenuOpen) {
      // using display: 'inherit' will make it `flex-row`
      this.els.searchMenuBody.style.display = 'block';
    }
    else {
      this.els.searchMenuBody.style.display = 'none';
    }

    decorateClasses(this.els.searchMenu, {
      active: !!this.searchMenuOpen
    });
  }

  // ###########################################################################
  // update
  // ###########################################################################

  update = () => {
    this.decorateButtons();
    this.renderModes();
  }

  decorateButtons() {
    const {
      followMode,
      locMode,
      callMode,
      valueMode,
      thinMode,
      hideBefore,
      hideAfter,
      graphMode,
      stackMode,
      asyncDetailMode,
      statsEnabled,
    } = this.parent.state;

    const {
      isThreadSelectionActive
    } = this.state;

    const themeModeName = ThemeMode.getName(this.context.themeMode).toLowerCase();

    decorateClasses(this.els.followModeBtn, {
      active: followMode
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
      active: !!hideBefore
    });
    decorateClasses(this.els.hideNewRunBtn, {
      active: !hideAfter
    });
    decorateClasses(this.els.graphModeBtn, {
      active: graphMode !== GraphType.None
    });
    decorateClasses(this.els.asyncStackBtn, {
      active: stackMode !== StackMode.Hidden
    });
    decorateClasses(this.els.asyncDetailModeBtn, {
      active: !!asyncDetailMode
    });
    decorateClasses(this.els.searchMenuBtn, {
      active: this.searchBar.state.mode !== SearchMode.None
    });
    decorateClasses(this.els.searchContextsBtn, {
      active: this.searchBar.state.mode === SearchMode.ByContext
    });
    decorateClasses(this.els.searchTracesBtn, {
      active: this.searchBar.state.mode === SearchMode.ByTrace
    });
    decorateClasses(this.els.searchValuesBtn, {
      active: this.searchBar.state.mode === SearchMode.ByValue
    });
    decorateClasses(this.els.clearThreadSelectionBtn, {
      hidden: !isThreadSelectionActive
    });
    decorateClasses(this.els.statsBtn, {
      active: statsEnabled
    });
    [`navbar-${themeModeName}`, `bg-${themeModeName}`].forEach(mode => this.el.classList.add(mode));
    this.els.thinModeBtn.innerHTML = `${!!thinMode && '||&nbsp;' || '|&nbsp;|'}`;
    this.els.hideNewRunBtn.innerHTML = `${hideAfter ? '⚪' : '🔴'}`;

    this.els.graphModeBtn.innerHTML = getGraphTypeDisplayName(graphMode);
    this.els.asyncStackBtn.innerHTML = getStackModeDisplayName(stackMode);
  }

  renderModes() {
    const {
      locMode,
      callMode,
      valueMode,
      thinMode,
      asyncDetailMode,
      statsEnabled,
    } = this.parent.state;

    const docEl = this.parent.el;
    decorateClasses(docEl, {
      'hide-locs': !locMode,
      'hide-values': !valueMode,
      'show-values': valueMode,
      'thin-mode': thinMode,
      'stats-disabled': !statsEnabled,
    });

    decorateAttr(docEl, {
      'data-call-mode': callMode && 1 || 0,
      'data-async-detail-mode': asyncDetailMode && 1 || 0,
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

    followModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.remote.toggleFollowMode();
      },

      focus(evt) { evt.target.blur(); }
    },

    locModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.parent.setState({
          locMode: !this.parent.state.locMode
        });
      },
      focus(evt) { evt.target.blur(); }
    },

    callModeBtn: {
      click(evt) {
        evt.preventDefault();
        evt.target.blur();

        this.parent.setState({
          callMode: !this.parent.state.callMode
        });
      },
      // focus(evt) { evt.target.blur(); }
    },
    valueModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.parent.setState({
          valueMode: !this.parent.state.valueMode
        });
      },
      focus(evt) { evt.target.blur(); }
    },
    thinModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.parent.setState({
          thinMode: !this.parent.state.thinMode
        });
      },
      focus(evt) { evt.target.blur(); }
    },
    packageWhitelistBtn: {
      async click(evt) {
        evt.preventDefault();
        await this.remote.setContextFilter('packageWhitelist');
      },
      focus(evt) { evt.target.blur(); }
    },
    packageBlacklistBtn: {
      async click(evt) {
        evt.preventDefault();
        await this.remote.setContextFilter('packageBlacklist');
      },
      focus(evt) { evt.target.blur(); }
    },
    hideOldRunBtn: {
      click(evt) {
        evt.preventDefault();
        const mode = !this.parent.state.hideBefore;
        this.remote.hideOldRun(mode && Date.now());
      },
      focus(evt) { evt.target.blur(); }
    },
    hideNewRunBtn: {
      click(evt) {
        evt.preventDefault();
        const mode = !this.parent.state.hideAfter;
        this.remote.hideNewRun(mode && Date.now());
      },
      focus(evt) { evt.target.blur(); }
    },
    graphModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.remote.nextGraphMode();
      },
      focus(evt) { evt.target.blur(); }
    },
    asyncStackBtn: {
      click(evt) {
        evt.preventDefault();
        this.remote.nextStackMode();
      },
      focus(evt) { evt.target.blur(); }
    },
    asyncDetailModeBtn: {
      click(evt) {
        evt.preventDefault();
        this.parent.setState({
          asyncDetailMode: !this.parent.state.asyncDetailMode
        });
      },
      focus(evt) { evt.target.blur(); }
    },
    clearThreadSelectionBtn: {
      click(evt) {
        evt.preventDefault();
        this.remote.clearThreadSelection();
      },
      focus(evt) { evt.target.blur(); }
    },
    statsBtn: {
      async click(evt) {
        evt.preventDefault();
        await this.remote.toggleStats();
      }
    },

    searchContextsBtn: {
      async click(evt) {
        evt.preventDefault();
        if (this.searchBar.state.mode === SearchMode.ByContext) {
          // stop searching
          await this.remote.setSearchMode(SearchMode.None);
        }
        else {
          await this.remote.setSearchMode(SearchMode.ByContext);
        }
      },
      focus(evt) { evt.target.blur(); }
    },

    searchTracesBtn: {
      async click(evt) {
        evt.preventDefault();
        if (this.searchBar.state.mode === SearchMode.ByTrace) {
          // stop searching
          await this.remote.setSearchMode(SearchMode.None);
        }
        else {
          await this.remote.setSearchMode(SearchMode.ByTrace);
        }
      },
      focus(evt) { evt.target.blur(); }
    },

    searchValuesBtn: {
      async click(evt) {
        evt.preventDefault();
        if (this.searchBar.state.mode === SearchMode.ByValue) {
          // stop searching
          await this.remote.setSearchMode(SearchMode.None);
        }
        else {
          await this.remote.setSearchMode(SearchMode.ByValue);
        }
      },
      focus(evt) { evt.target.blur(); }
    },

    searchMenuBtn: {
      async click() {
        if (this.searchBar.state.mode !== SearchMode.None) {
          // stop searching
          await this.remote.setSearchMode(SearchMode.None);
        }
        else {
          this.toggleSearchMenu();
        }
      },
      focus(evt) { evt.target.blur(); }
    },

    searchMenuToggleBtn: {
      click() {
        this.toggleSearchMenu();
      },
      focus(evt) { evt.target.blur(); }
    },

    mainMenuBtn: {
      click(/* evt */) {
        this.toggleMainMenu();
      },
      focus(evt) { evt.target.blur(); }
    },

    contextFilterMenuBtn: {
      click(/* evt */) {
        this.toggleContextFilterMenu();
      },
      focus(evt) { evt.target.blur(); }
    },
  }
}

export default Toolbar;
