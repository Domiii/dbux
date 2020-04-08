import createPanzoom from 'panzoom';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');

    // complete reset
    el.innerHTML = /*html*/`<div>
      <div data-mount="Toolbar"></div>
      <div data-mount="GraphRoot"></div>
    </div>`;

    this.panzoom = this.initPanZoom(el);
    window.addEventListener('keypress', async (e) => {
      if (e.key === "s") {
        let contextId = await this.app.prompt("traceId");
        contextId = contextId && parseInt(contextId);
        if (contextId) {
          this.slide(contextId, 1);
        }
      }
    });
    return el;
  }

  initPanZoom = (el) => {
    let panzoom;
    panzoom = createPanzoom(el, {
      smoothScroll: false,
      zoomDoubleClickSpeed: 1,
      beforeWheel(evt) {
        let shouldIgnore = !evt.ctrlKey;
        return shouldIgnore;
      },
      beforeMouseDown(evt) {
        // allow mouse-down panning only if altKey is down. Otherwise - ignore
        let shouldIgnore = !evt.altKey;
        return shouldIgnore;
      },
      bounds: true,
      boundsPadding: 0.1,
      maxZoom: 2,
      minZoom: 0.1,
    });
    window.panzoom = panzoom;

    panzoom.zoomAbs(
      0,
      0,
      0.5
    );


    panzoom.on('panstart', function (e) {
      console.log('panstart', e);
      // Note: e === instance.
    });

    panzoom.on('pan', function (e) {
      console.log('pan', e);
    });

    panzoom.on('panend', function (e) {
      console.log('panend', e);
    });

    panzoom.on('zoom', function (e) {
      console.log('Fired when `element` is zoomed', e);
    });

    panzoom.on('zoomend', function (e) {
      console.log('Fired when zoom animation ended', e);
    });

    panzoom.on('transform', function (e) {
      // This event will be called along with events above.
      console.log('transform', e);
    });

    return panzoom;
  }
  //focus slide. referance https://codepen.io/relign/pen/qqZxqW?editors=0011
  slide = (contextId, slideSpeed) => {
    slideSpeed = slideSpeed || 1;
    contextId = contextId === "root" ? '#root' : '#context_' + contextId;
    let node = document.querySelector(contextId);

    requestAnimationFrame(() => this.step(node, slideSpeed));

    node.classList.add("flash-me");
    setTimeout(() => { node.classList.remove("flash-me"); }, (slideSpeed + 3) * 1000);
  }
  step = (node, slideSpeed) => {
    let nodePos = node.getBoundingClientRect();
    let distanceX = 0 - nodePos.x;//+(window.innerWidth-nodePos.width)/2;
    let distanceY = 0 - nodePos.y;//+(window.innerHeight-nodePos.height)/2;

    let startTime = Date.now();
    let startX = this.panzoom.getTransform().x;
    let startY = this.panzoom.getTransform().y;
    let progress = Math.min(1.0, (Date.now() - startTime) / (slideSpeed * 1000));

    this.panzoom.moveTo(startX + distanceX * progress, startY + distanceY * progress);
    if (progress < 1.0) {
      window.requestAnimationFrame(() => this.step(node, slideSpeed));
    }
  }
}

export default GraphDocument;