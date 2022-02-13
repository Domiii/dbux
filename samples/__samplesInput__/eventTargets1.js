
function cb(...args) {
  console.log('event fired. args:', ...args)
}
function cb2(...args) {
  console.log('event fired. args:', ...args)
}

(function main() {
  const eventTarget = new EventTarget();
  eventTarget.addEventListener('test', cb1);
  eventTarget.addEventListener('test', cb2);

  setTimeout(() => {
    const evt1 = new Event('test', { x: 1 });
    eventTarget.dispatchEvent(evt1);

    eventTarget.removeEventListener(cb1);

    const evt2 = new Event('test', { x: 2 });
    eventTarget.dispatchEvent(evt2);

    eventTarget.removeEventListener(cb2);

    const evt3 = new Event('test', { x: 3 });
    eventTarget.dispatchEvent(evt3);
  });
})();