import LayoutAlgorithmType from '@dbux/graph-common/src/ddg/types/LayoutAlgorithmType';
import { compileHtmlElement, decorateClasses } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

let documentClickHandler;

/** @typedef { import("./DDGDocument").default } DDGDocument */

class Toolbar extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <nav class="navbar sticky-top navbar-expand-lg no-padding" id="toolbar">
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
        <button title="Rebuild" data-el="rebuildBtn" class="toolbar-btn btn btn-info" href="#">
          Rebuild 🔁
        </button>
        <button title="Connected Only" data-el="connectModeBtn" class="toolbar-btn btn btn-info" href="#">
          con
        </button>
          <button title="Layout (ForceLayout)" data-el="layoutForceBtn" class="hidden toolbar-btn btn btn-info" href="#">
            ForceLayout
          </button>
          <button title="Layout (ForceAtlas2)" data-el="layoutAtlas2Btn" class="hidden toolbar-btn btn btn-info" href="#">
            ForceAtlas2
          </button>
        </div>
      </nav>
    `);
  }

  setupEl() {
    if (documentClickHandler) {
      document.removeEventListener('click', documentClickHandler);
    }
    document.addEventListener('click', documentClickHandler = this._onDocumentClick);
  }

  _onDocumentClick = (evt) => {
  };

  // ###########################################################################
  // update
  // ###########################################################################

  update = () => {
    this.decorateButtons();
    this.renderModes();
  }

  decorateButtons() {
    const {
      // layoutType,
      connectedOnlyMode
    } = this.parent.state;

    
    decorateClasses(this.els.connectModeBtn, {
      active: connectedOnlyMode
    });

    // this.els.layoutButton.innerHTML = LayoutAlgorithmType.nameFromForce(layoutType);
  }

  renderModes() {

  }

  /**
   * @type {DDGDocument}
   */
  get doc() {
    return this.parent;
  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  on = {
    rebuildBtn: {
      async click(evt) {
        evt.preventDefault();
        this.doc.timeline.rebuildGraph();
      },

      focus(evt) { evt.target.blur(); }
    },

    connectModeBtn: {
      async click(evt) {
        evt.preventDefault();
        await this.remote.setGraphDocumentMode({
          connectedOnlyMode: !this.doc.state.connectedOnlyMode,
        });
      },

      focus(evt) { evt.target.blur(); }
    },

    layoutForceBtn: {
      async click(evt) {
        evt.preventDefault();
        if (!await this.remote.setLayoutAlgorithm(LayoutAlgorithmType.ForceLayout)) {
          this.doc.timeline.autoLayout();
        }
      },

      focus(evt) { evt.target.blur(); }
    },

    layoutAtlas2Btn: {
      async click(evt) {
        evt.preventDefault();
        if (!await this.remote.setLayoutAlgorithm(LayoutAlgorithmType.ForceAtlas2)) {
          this.doc.timeline.autoLayout();
        }
        // const { layoutType } = this.parent.state;
        // await this.remote.setLayoutAlgorithm(LayoutAlgorithmType.nextValue(layoutType));
      },

      focus(evt) { evt.target.blur(); }
    }
  }
}

export default Toolbar;
