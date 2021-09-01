import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

export default class ZoomBtn extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div id = "zoombar" class="flex-column">
        <button data-el="zoomInBtn" class="button">+</button>
        <button data-el="zoomOutBtn" class="button">-</button>
      </div>
   `);
  }

  on = {
    zoomInBtn: {
      click() {
        const canvas = this.parent.els.panzoomCanvas;
        this.panzoom.zoomTo(canvas.offsetWidth / 2, canvas.offsetHeight / 2, this.panzoom.getScaleMultiplier(-1 * 100));
      }
    },
    zoomOutBtn: {
      click() {
        const canvas = this.parent.els.panzoomCanvas;
        this.panzoom.zoomTo(canvas.offsetWidth / 2, canvas.offsetHeight / 2, this.panzoom.getScaleMultiplier(1 * 100));
      }
    }
  }
}