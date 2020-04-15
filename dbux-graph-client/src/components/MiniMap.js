import { makeDebounce } from 'dbux-common/src/util/scheduling'
import html2canvas from 'html2canvas';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '@/util/domUtil';

class MiniMap extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
    <canvas id = "minimap"></canvas>
    `);
  }
  update() {
    this.el.height = window.innerHeight - 60;
    this.el.width = window.innerWidth / 6;

    const mutationObserver = new MutationObserver(this.drawMiniMap);
    mutationObserver.observe(this.parent.el.querySelector('.root'), {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });
    // mutationObserver.disconnect();
  }
  drawMiniMap = makeDebounce(() => {
    const rootEl = this.parent.el.querySelector('.root');
    html2canvas(rootEl).then((canvas) => {
      console.log(canvas);
      let data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      canvas.style.transform = 'scale(' + 1 / (data.width / this.el.width) + ',' + 1 / (data.width / this.el.width) + ')';
      let ctx = this.el.getContext('2d');
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(1 / (data.width / this.el.width), 1 / (data.width / this.el.width));
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
    });
  }, 200);
}
export default MiniMap;