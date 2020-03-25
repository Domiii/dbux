async function getData(path) {
  const res = await fetch(path);
  return res.json();
}

async function loadData(path) {
  const data = await getData(path);
  const preEl = document.createElement('pre');
  preEl.textContent = JSON.stringify(data, null, 2);
  document.body.appendChild(preEl);
}

(async function main() {
  // hook up event listeners
  window.addEventListener('message', async evt => {
    const {
      func: funcName,
      args
    } = evt.data;

    if (!funcName) {
      return;
    }

    try {
      const func = eval(funcName);
      await func(...args);
    }
    catch (err) {
      console.error('Failed to execute command:', funcName, args, err);
    }
  });
})();