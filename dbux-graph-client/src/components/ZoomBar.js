import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class ZoomBtn extends ClientComponentEndpoint {
  createEl() {
    this.panzoom = this.owner.panzoom;

    window.panzoom = this.panzoom;

    return compileHtmlElement(/*html*/`
      <div id = "zoombar" class="flex-column">
        <button data-el="zoomInBtn" class="button">+</button>
        <button data-el="zoomOutBtn" class="button">-</button>
      </div>
   `);
  }
  // update() {
  //   const { focus } = this.state;
  //   this.focusBounds = this.getFocusBounds(focus);
  // }

  // getFocusBounds = (applicationId, contextId) => {
  //   const nodeId = `#application_${applicationId}-context_${contextId}`;
  //   let node = document.querySelector(nodeId);
  //   return {
  //     x: node.getBoundingClientRect(),
  //     y: node.getBoundingClientRect()
  //   };
  // }
  on = {
    zoomInBtn: {
      click() {
        // need better getter to get graph container
        this.cont = document.querySelector('.graph-cont');
        // set zoom origin point center with window
        this.panzoom.zoomTo(this.cont.offsetWidth / 2, this.cont.offsetHeight / 2, this.panzoom.getScaleMultiplier(-1 * 100));
      }
    },
    zoomOutBtn: {
      click() {
        this.cont = document.querySelector('.graph-cont');
        this.panzoom.zoomTo(this.cont.offsetWidth / 2, this.cont.offsetHeight / 2, this.panzoom.getScaleMultiplier(1 * 100));
      }
    }
  }
}