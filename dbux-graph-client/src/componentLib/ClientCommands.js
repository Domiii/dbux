import sleep from '@dbux/common/src/util/sleep';

async function fetchData(path) {
  const res = await fetch(path);
  return res.json();
}


/**
 * Provides host-issued commands.
 */
class ClientCommands {
  constructor(graph) {
    this.graph = graph;
  }

  async sayHello() {
    await sleep(100);
    return 'hi!';
  }

  async loadData(path) {
    const data = await fetchData(path);
    const preEl = document.createElement('pre');
    preEl.textContent = JSON.stringify(data, null, 2);
    document.body.appendChild(preEl);
  }

  addContexts(contexts) {
    // TODO
  }
}

export default ClientCommands;