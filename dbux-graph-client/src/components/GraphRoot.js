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
        <div data-el="graphCont" class="graph-cont">
          <div data-el="body" class="body flex-column">
            <h2 data-el="title"></h2>
            <div>
              <button data-el="nodeToggleBtn" class="nodeToggleBtn"></button>
            </div>
            <div data-mount="HiddenBeforeNode"></div>
            <div data-el="nodeChildren" data-mount="RunNode" class="node-children flex-column">
              <div class="before-run-node"></div>
            </div>
            <div data-mount="HiddenAfterNode"></div>
          </div>
        </div>
        <div data-el="toolTip" id="tooltip" role="tooltip">
          <span></span>
          <div id="arrow" data-popper-arrow></div>
        </div>
        <div data-mount="ZoomBar"></div> 
      </div>
    `);
  }

  get popperManager() {
    return this.controllers.getComponent('PopperManager');
  }

  setupEl() {
    this.panzoom = this.initPanZoom(this.els.graphCont);
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
      beforeWheel(evt) {
        let shouldIgnore = !evt.ctrlKey;
        return shouldIgnore;
      },
      beforeMouseDown(evt) {
        // allow mouse-down panning only if altKey is down. Otherwise - ignore
        let shouldIgnore = !evt.altKey;
        return shouldIgnore;
      },
      maxZoom: 5,
      minZoom: 0.1,
    });

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