import createPanzoom from '@dbux/panzoom';
import ThemeMode from '@dbux/graph-common/src/shared/ThemeMode';
import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');
    el.innerHTML = /*html*/`<div>
      <div data-mount="Toolbar"></div>
      <div data-el="panzoomCanvas" class="graph-cont">
        <div data-el="body" class="body flex-column">
          <div data-mount="GraphRoot"></div>
          <div data-mount="AsyncGraph"></div>
        </div>
      </div>
      <div data-mount="ZoomBar"></div> 
    </div>`;
    return el;
  }

  setupEl() {
    this.panzoom = this.initPanZoom(this.els.panzoomCanvas);
  }

  update() {
    const { themeMode } = this.state; 
    if (ThemeMode.is.Dark(themeMode)) {
      document.body.classList.add('theme-mode-dark');
    }
    else {
      document.body.classList.remove('theme-mode-dark');
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

export default GraphDocument;