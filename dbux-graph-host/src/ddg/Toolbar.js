import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef { import("./DDGDocument").default } DDGDocument */

class Toolbar extends HostComponentEndpoint {
  init() {
  }

  /**
   * @type {DDGDocument}
   */
  get doc() {
    return this.parent;
  }

  public = {
    setLayoutAlgorithm(layoutType) {
      this.doc.setDocumentMode({ layoutType });
    },
  }
}

export default Toolbar;