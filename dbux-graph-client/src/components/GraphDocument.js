import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');
    let mouseDown = false;
    // complete reset
    el.innerHTML = /*html*/`<div>
      <div data-mount="Toolbar"></div>
      <div data-mount="GraphRoot"></div>
      <div data-mount="MiniMap" id = "minimap"></div>
    </div>`;
    // window.addEventListener('mousedown', () => {
    //   mouseDown = true;
    // });
    // window.addEventListener('mouseup', () => {
    //   mouseDown = false;
    // });
    // window.addEventListener('mousemove', () => {
    //   if (mouseDown) console.log(el.getBoundingClientRect());
    // });
    return el;
  }

  /**
   * hackfix: the VSCode webview does not re-render correctly when `panzoom` library updates element `transform`.
   *    This forces it to re-render.
   */
  _repaint = () => {
    // var el = document.querySelector('#root');
    // var el = domElement;
    const { el } = this;
    const p = el.parentNode;
    p.removeChild(el);
    p.appendChild(el);
  }
}

export default GraphDocument;