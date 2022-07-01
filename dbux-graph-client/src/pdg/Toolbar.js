// import LayoutAlgorithmType from '@dbux/graph-common/src/pdg/types/LayoutAlgorithmType';

import PDGSummaryMode, { RootSummaryModes } from '@dbux/data/src/pdg/PDGSummaryMode';
import { PDGRootTimelineId } from '@dbux/data/src/pdg/constants';
import { BootstrapBtnGroupSeparatorHtml, compileHtmlElement, decorateClasses, makeBootstrapBtnGroupSeparatorEl } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { updateElDecorations, makeSummaryButtons, DefaultToolbarBtnClass, makeSettingsButtons } from './pdgDomUtil';

let documentClickHandler;

/** @typedef { import("./PDGDocument").default } PDGDocument */


class Toolbar extends ClientComponentEndpoint {
  summaryRootButtons;

  createEl() {
    const el = compileHtmlElement(/*html*/`
      <nav class="navbar sticky-top navbar-expand-lg no-padding" id="toolbar">
        <div data-el="buttons" class="btn-group btn-group-toggle" data-toggle="buttons">
          <button title="Rebuild" data-el="rebuildBtn" class="toolbar-btn btn btn-info" href="#">
            🔁
          </button>
          <button title="Take Screenshot" data-el="screenshotBtn" class="toolbar-btn btn btn-info" href="#">
            📸
          </button>
          ${BootstrapBtnGroupSeparatorHtml}
        </div>
      </nav>
    `);

    const btns = el.querySelector('.btn-group');

    // add settings buttons
    if (this.doc.state.settings) {
      btns.appendChild(makeSettingsButtons(this.doc).el);
      btns.appendChild(makeBootstrapBtnGroupSeparatorEl());
    }

    // add root control buttons
    const {
      el: summaryRootButtonDom,
      els: summaryRootButtons
    } = makeSummaryButtons(this.doc, PDGRootTimelineId, DefaultToolbarBtnClass, RootSummaryModes, true);
    btns.appendChild(summaryRootButtonDom);
    this.summaryRootButtons = summaryRootButtons;

    return el;
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
    // const {
    //   // layoutType,
    //   connectedOnlyMode
    // } = this.parent.state;
    // decorateClasses(this.els.connectedOnlyModeBtn, {
    //   active: connectedOnlyMode
    // });

    // update all buttons
    // updateElDecorations(this.summaryRootButtons);
    updateElDecorations(this.els.buttons.querySelectorAll('.btn'));
  }

  renderModes() {
  }

  /**
   * @type {PDGDocument}
   */
  get doc() {
    return this.context.doc;
  }


  on = {
    rebuildBtn: {
      async click(evt) {
        evt.preventDefault();
        this.doc.timeline.rebuildGraph(true);
      },

      focus(evt) { evt.target.blur(); }
    },
    screenshotBtn: {
      async click(evt) {
        evt.preventDefault();
        const svgString = this.doc.timeline.getScreenshot();
        await this.doc.timeline.remote.saveScreenshot(svgString);
      },

      focus(evt) { evt.target.blur(); }
    },

    // connectedOnlyModeBtn: {
    //   async click(evt) {
    //     evt.preventDefault();
    //     await this.remote.setGraphDocumentMode({
    //       connectedOnlyMode: !this.doc.state.connectedOnlyMode,
    //     });
    //   },

    //   focus(evt) { evt.target.blur(); }
    // },

    // mergeComputationsBtn: {
    //   async click(evt) {
    //     evt.preventDefault();
    //     await this.remote.setGraphDocumentMode({
    //       mergeComputesMode: !this.doc.state.mergeComputesMode
    //     });
    //   },

    //   focus(evt) { evt.target.blur(); }
    // },

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
