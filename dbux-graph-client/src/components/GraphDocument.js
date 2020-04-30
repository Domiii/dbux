import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphDocument extends ClientComponentEndpoint {
  createEl() {
    const el = document.getElementById('root');
    // let mouseDown = false;
    // complete reset
    el.innerHTML = /*html*/`<div>
      <div data-mount="Toolbar"></div>
      <div data-mount="GraphRoot"></div>
      </div>`;
    // <div data-mount="MiniMap" id = "minimap"></div>
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
}

export default GraphDocument;