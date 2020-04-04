import ClientComponentEndpoint from '../componentLib/ClientComponentEndpoint';

class GraphRoot extends ClientComponentEndpoint {
  titleEl;

  initEl() {
    // create elements
    const el = document.createElement('div');
    this.titleEl = document.createElement('h3');

    // append children
    el.appendChild(this.titleEl);

    // return `el`
    return el;
  }

  update() {
    const { applications } = this.state;
    if (applications) {
      this.titleEl.textContent = `${applications.map(app => app.name).join(', ')}`;
    }
    else {
      this.titleEl.textContent = '(no applications selected)';
    }
  }
}

export default GraphRoot;