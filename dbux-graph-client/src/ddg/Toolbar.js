// import LayoutAlgorithmType from '@dbux/graph-common/src/ddg/types/LayoutAlgorithmType';
import DDGSummaryMode, { RootSummaryModes } from '@dbux/data/src/ddg/DDGSummaryMode';
import { RootTimelineId } from '@dbux/data/src/ddg/constants';
import { compileHtmlElement, decorateClasses } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

let documentClickHandler;

/** @typedef { import("./DDGDocument").default } DDGDocument */

const toolbarIconSize = '12px';

class Toolbar extends ClientComponentEndpoint {
  createEl() {
    const { summaryIconUris } = this.context.doc.state;

    const summaryModeButtons = RootSummaryModes.map(mode => {
      const label = summaryIconUris[mode] ?
        /*html*/`<img width="${toolbarIconSize}" src="${summaryIconUris[mode]}" />` :
        '👁';
      const modeName = DDGSummaryMode.nameFrom(mode);
      const elName = `summary${modeName}`;
      this.#addRootModeListener(elName, mode);
      return `<button title="${modeName}" data-el="${elName}" class="toolbar-btn btn btn-info" href="#">
          ${label}
       </button>`;
    });

    return compileHtmlElement(/*html*/`
      <nav class="navbar sticky-top navbar-expand-lg no-padding" id="toolbar">
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
        <button title="Rebuild" data-el="rebuildBtn" class="toolbar-btn btn btn-info" href="#">
          Rebuild 🔁
        </button>
        
        &nbsp;

        <button title="Hide subgraphs that are not affected any watched node" data-el="connectModeBtn" class="toolbar-btn btn btn-info" href="#">
          con
        </button>
        <button title="Merge computation subgraphs" data-el="mergeComputationsBtn" class="toolbar-btn btn btn-info" href="#">
          ⚙
        </button>
        
        &nbsp;

        ${summaryModeButtons}
        
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

    // TODO: update SummaryMode buttons

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

  #addRootModeListener(elName, mode) {
    this.on[elName] = {
      async click(evt) {
        evt.preventDefault();
        this.doc.timeline.setSummaryMode(RootTimelineId, mode);
      },

      focus(evt) { evt.target.blur(); }
    };
  }

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

    mergeComputationsBtn: {
      async click(evt) {
        evt.preventDefault();
        await this.remote.setGraphDocumentMode({
          mergeComputesMode: !this.doc.state.mergeComputesMode
        });
      },

      focus(evt) { evt.target.blur(); }
    },

    // layoutForceBtn: {
    //   async click(evt) {
    //     evt.preventDefault();
    //     if (!await this.remote.setLayoutAlgorithm(LayoutAlgorithmType.ForceLayout)) {
    //       this.doc.timeline.autoLayout();
    //     }
    //   },

    //   focus(evt) { evt.target.blur(); }
    // },

    // layoutAtlas2Btn: {
    //   async click(evt) {
    //     evt.preventDefault();
    //     if (!await this.remote.setLayoutAlgorithm(LayoutAlgorithmType.ForceAtlas2)) {
    //       this.doc.timeline.autoLayout();
    //     }
    //     // const { layoutType } = this.parent.state;
    //     // await this.remote.setLayoutAlgorithm(LayoutAlgorithmType.nextValue(layoutType));
    //   },

    //   focus(evt) { evt.target.blur(); }
    // }
  }
}

export default Toolbar;
