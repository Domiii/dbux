import createPanzoom from 'panzoom';
import { compileHtmlElement } from '@/util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphRoot extends ClientComponentEndpoint {
  createEl() {
    window.addEventListener('keypress', async (e) => {
      if (e.key === "s") {
        let applicationId = await this.app.prompt("applicationId");
        let contextId = await this.app.prompt("traceId");
        applicationId = applicationId && parseInt(applicationId, 10);
        contextId = contextId && parseInt(contextId, 10);
        
        if (applicationId && contextId) {
          this.remote.requestFocus(applicationId, contextId);
        }
      }
    });

    return compileHtmlElement(/*html*/`
      <div class="graph-root">
        <div data-el="body" class="flex-column">
          <h2 data-el="title"></h2>
          <div>
            <button data-el="nodeToggleBtn" class="nodeToggleBtn"></button>
          </div>
          <div data-el="nodeChildren" data-mount="RunNode" class="node-children">
            <div class="before-run-node"></div>
          </div>
        </div>
        <div data-el="toolTip" id="tooltip" role="tooltip">
          <span></span>
          <div id="arrow" data-popper-arrow></div>
        </div>   
      </div>
    `);
  }

  get popperManager() {
    return this.controllers.getComponent('PopperManager');
  }
  
  test() {}

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
    let panzoom = createPanzoom(el, {
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
      boundsPadding: 0.2,
      maxZoom: 2,
      minZoom: 0.1,
    });
    // [debug-global]
    // window.panzoom = panzoom;

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

    panzoom.on('zoomend', (e) => {
      // this._repaint();
    });

    panzoom.on('transform', (e) => {
      // this._repaint();
    });

    return panzoom;
  } 
}
export default GraphRoot;