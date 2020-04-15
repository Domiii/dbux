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
    this.el.height = window.innerHeight - 20;
    this.el.width = window.innerWidth / 6;
    this.drawMiniMap(this.el);
  }
  drawMiniMap = () => {
    debugger;
    const rootEl = this.parent.el.querySelector('.root');
    html2canvas(rootEl).then((canvas) => {
      console.log(canvas);
      let data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
      canvas.style.transform = 'scale(' + 1 / (data.height / (window.innerHeight - 20)) + ',' + 1 / (data.height / (window.innerHeight - 20)) + ')';
      let ctx = this.el.getContext('2d');
      ctx.scale(1 / (data.height / (window.innerHeight - 20)), 1 / (data.height / (window.innerHeight - 20)));
      ctx.drawImage(canvas, 0, 0);
    });
  }
}

export default MiniMap;