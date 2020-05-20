import { compileHtmlElement } from '@/util/domUtil';
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
  on = {
    zoomInBtn: {
      click() {
        const { top } = document.querySelector('.graph-root').getBoundingClientRect();
        this.panzoom.zoomTo(0, 30 - top, this.panzoom.getScaleMultiplier(-1 * 100));
      }
    },
    zoomOutBtn: {
      click() {
        const { top } = document.querySelector('.graph-root').getBoundingClientRect();
        this.panzoom.zoomTo(0, 30 - top, this.panzoom.getScaleMultiplier(1 * 100));
      }
    }
  }
}