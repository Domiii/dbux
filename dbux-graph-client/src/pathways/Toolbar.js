// import PathwaysMode from '@dbux/data/src/pathways/PathwaysMode';
import { compileHtmlElement, decorateClasses } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class Toolbar extends ClientComponentEndpoint {
  // ###########################################################################
  // createEl
  // ###########################################################################
  createEl() {
    // return compileHtmlElement(/*html*/`<div></div>`);
    return compileHtmlElement(/*html*/`
      <nav class="navbar navbar-expand-lg no-padding" id="toolbar">
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
          <button info="Show timers on steps" title="" data-el="timeBtn" class="btn btn-info" href="#">
            🕒
          </button>
          <button title="" data-el="modeBtn" class="btn btn-info" href="#">
            summarize
          </button>
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

  }

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
    // this.els.modeBtn.textContent = PathwaysMode.nameFrom(pathwaysMode);

    decorateClasses(this.els.modeBtn, {
      active: this.context.doc.isAnalyzing()
    });

    decorateClasses(this.els.timeBtn, {
      active: !!this.context.doc.state.showTime
    });
  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  on = {

    modeBtn: {
      async click(evt) {
        await this.context.doc.remote.cyclePathwaysMode();
      },

      focus(evt) { evt.target.blur(); }
    },

    timeBtn: {
      async click(evt) {
        this.context.doc.setState({
          showTime: !this.context.doc.state.showTime
        });

        // need to refresh (TODO: only re-render all nodes)
        await this.context.doc.remote.refresh();
      },

      focus(evt) { evt.target.blur(); }
    },


    restartBtn: {
      async click(evt) {
        evt.preventDefault();

        if (await this.app.confirm('Do you really want to restart?')) {
          this.componentManager.restart();
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