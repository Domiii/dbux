import createPanzoom from '@dbux/panzoom';
import { compileHtmlElement } from '../../util/domUtil';
import ClientComponentEndpoint from '../../componentLib/ClientComponentEndpoint';

class AsyncGraph extends ClientComponentEndpoint {
  createEl() {
    return compileHtmlElement(/*html*/`
      <div class="graph-root">
        <div data-el="graphCont" class="graph-cont">
          <div data-el="body" class="body flex-column">
            <h4>Applications:</h4>
            <pre data-el="applications"></pre>
            <div data-el="nodeChildren" data-mount="ThreadColumn" class="node-children flex-row">
            </div>
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
    const { asyncGraphMode } = this.context.graphDocument.state;
    if (!asyncGraphMode) {
      this.el.classList.add('hidden');
    }
    else {
      this.el.classList.remove('hidden');
      const { applications } = this.state;
      if (applications?.length) {
        this.els.applications.textContent = ` ${applications.map(app => app.name).join('\n ')}`;
      }
      else {
        this.els.applications.textContent = '(no applications selected)';
      }
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
      // repaintEl(this.els.body);
      this.els.graphCont.removeEventListener('scroll', repaint);
    };
    this.els.graphCont.addEventListener('scroll', repaint);

    return panzoom;
  }
}
export default AsyncGraph;