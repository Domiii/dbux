import createPanzoom from 'panzoom';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';
import { compileHtmlElement } from '@/util/domUtil';
import popperManeger from '../popperManeger';

class GraphRoot extends ClientComponentEndpoint {
  createEl() {
    window.addEventListener('keypress', async (e) => {
      if (e.key === "s") {
        let contextId = await this.app.prompt("traceId");
        contextId = contextId && parseInt(contextId);
        if (contextId) {
          this.slide(contextId, 1);
        }
      }
    });
    return compileHtmlElement(/*html*/`
      <div class="root">
        <div data-el="body">
          <h2 data-el="title"></h2>
          <div data-mount="RunNode"></div>
        </div>
        <div data-el="toolTip" id="tooltip" role="tooltip">
          <span></span>
          <div id="arrow" data-popper-arrow></div>
        </div>   
      </div>
    `);
  }

  setupEl() {
    this.panzoom = this.initPanZoom(this.els.body);

    // hackfix: make popperEl global for now
    window._popperEl = this.els.toolTip;
  }

  update() {
    const { applications } = this.state;
    if (applications?.length) {
      this.els.title.textContent = `${applications.map(app => app.name).join(', ')}`;
    }
    else {
      this.els.title.textContent = '(no applications selected)';
    }
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
      // beforeMouseDown(evt) {
      //   // allow mouse-down panning only if altKey is down. Otherwise - ignore
      //   let shouldIgnore = !evt.altKey;
      //   return shouldIgnore;
      // },
      boundsPadding: 0.2,
      maxZoom: 2,
      minZoom: 0.1,
    });
    window.panzoom = panzoom;

    panzoom.zoomAbs(
      0,
      0,
      1
    );

    panzoom.on('panstart', (e) => {
      // console.log('panstart', e);
    });

    panzoom.on('pan', (e) => {
      // this._repaint();
    });

    panzoom.on('panend', (e) => {
      // this._repaint();
    });

    panzoom.on('zoom', (e) => {
      // this._repaint();
      popperManeger.update();
    });

    panzoom.on('zoomend', (e) => {
      // this._repaint();
    });

    panzoom.on('transform', (e) => {
      this._repaint();
      popperManeger.update();
    });

    return panzoom;
  }
  //focus slide. referance https://codepen.io/relign/pen/qqZxqW?editors=0011
  slide = (contextId, slideSpeed = 1) => {
    contextId = contextId === "root" ? '#root' : '#context_' + contextId;
    let node = document.querySelector(contextId);
    if (!node) {
      alert("trace not foound");
    }
    let nodePos = node.getBoundingClientRect();
    let toolbar = document.querySelector("#toolbar");
    let barPos = toolbar.getBoundingClientRect();

    let slideData = {
      startTime: Date.now(),
      startX: this.panzoom.getTransform().x,
      startY: this.panzoom.getTransform().y,
      distanceX: barPos.left - nodePos.x,
      distanceY: barPos.bottom + 10 - nodePos.y,
      slideSpeed
    };

    requestAnimationFrame(() => this.step(node, slideData));

    node.classList.add("flash-me");
    setTimeout(() => { node.classList.remove("flash-me"); }, (slideSpeed + 3) * 1000);
  }
  step = (node, slideData) => {
    const {
      startTime,
      startX,
      startY,
      distanceX,
      distanceY,
      slideSpeed
    } = slideData;

    let progress = Math.min(1.0, (Date.now() - startTime) / (slideSpeed * 1000));

    this.panzoom.moveTo(startX + distanceX * progress, startY + distanceY * progress);
    this._repaint();
    if (progress < 1.0) {
      requestAnimationFrame(() => this.step(node, slideData));
    }
  }
}

export default GraphRoot;