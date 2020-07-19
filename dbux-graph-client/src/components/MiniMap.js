import { makeDebounce } from '@dbux/common/src/util/scheduling'
import html2canvas from 'html2canvas';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class MiniMap extends ClientComponentEndpoint {
  createEl() {
    // document.addEventListener('keypress', () => {
    //   const rootEl = this.parent.el.querySelector('.root');
    //   html2canvas(rootEl).then((canvas) => {
    //     document.querySelector('#test').innderHTML = '';
    //     document.querySelector('#test').appendChild(canvas);
    //   });
    // });
    return compileHtmlElement(/*html*/`
    <canvas id = "minimap"></canvas>
    `);
  }
  update() {
    this.el.height = window.innerHeight - 60;
    this.el.width = window.innerWidth / 6;

    // TODO: performance still suffers when facing great amounts of data (despite 500ms debouncing)
    // const mutationObserver = new MutationObserver(this.drawMiniMap);
    // mutationObserver.observe(this.parent.el.querySelector('#test'), {
    //   // attributes: true,
    //   // characterData: true,
    //   childList: true,
    //   subtree: true,
    //   // attributeOldValue: true,
    //   // characterDataOldValue: true
    // });
    // // mutationObserver.disconnect();
  }

  drawMiniMap = makeDebounce(() => {
    const rootEl = this.parent.el.querySelector('#test');
    html2canvas(rootEl).then((canvas) => {
      let data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      let ctx = this.el.getContext('2d');
      ctx.save();
      ctx.clearRect(0, 0, this.el.width, this.el.height);
      ctx.scale(1 / (data.width / this.el.width), 1 / (data.width / this.el.width));
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    });
  }, 500);
}
export default MiniMap;