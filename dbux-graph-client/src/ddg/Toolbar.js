import LayoutAlgorithmType from '@dbux/graph-common/src/ddg/types/LayoutAlgorithmType';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

let documentClickHandler;

class Toolbar extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <nav class="navbar sticky-top navbar-expand-lg no-padding" id="toolbar">
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
          <button title="Toggle Layout algorithm" data-el="layoutButton" class="toolbar-btn btn btn-info" href="#"></button>
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
      layoutType,
    } = this.parent.state;

    this.els.layoutButton.innerHTML = LayoutAlgorithmType.nameFromForce(layoutType);
  }

  renderModes() {

  }

  // ###########################################################################
  // event listeners
  // ###########################################################################

  on = {
    layoutButton: {
      async click(evt) {
        evt.preventDefault();
        const { layoutType } = this.parent.state;
        await this.remote.setLayoutAlgorithm(LayoutAlgorithmType.nextValue(layoutType));
      },

      focus(evt) { evt.target.blur(); }
    },
  }
}

export default Toolbar;
