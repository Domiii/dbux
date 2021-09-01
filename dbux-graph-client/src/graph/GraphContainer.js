import createPanzoom from '@dbux/panzoom';
import { compileHtmlElement } from '../util/domUtil';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphContainer extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="graph-container">
        <div data-el="panzoomCanvas" class="graph-content">
          <div data-el="body" class="body flex-column">
            <div data-mount="SyncGraph"></div>
            <div data-mount="AsyncGraph"></div>
            <div data-mount="AsyncStack"></div>
          </div>
        </div>
        <div data-mount="ZoomBar"></div> 
      </div>
    `);
  }

  setupEl() {
    this.panzoom = this.initPanZoom(this.els.panzoomCanvas);
  }

  update() {
    const { enabled } = this.state;
    if (enabled) {
      this.el.classList.remove('hidden');
    }
    else {
      this.el.classList.add('hidden');
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

    // hackfix: scrollbar bugs out when scrolling or when touching it the first time around; this fixes it
    //   (probably a webview bug)
    const repaint = () => {
      this._repaint();
      el.removeEventListener('scroll', repaint);
    };
    el.addEventListener('scroll', repaint);

    return panzoom;
  }

  get popperManager() {
    return this.controllers.getComponent('PopperManager');
  }
}

export default GraphContainer;