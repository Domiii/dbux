const evts = [];

function cb1(evt) {
  console.log('event fired:', evt);
  evts.push(evt);
}
function cb2(evt) {
  console.log('event2 fired:', evt);
  evts.push(evt);
}

(function main() {
  const eventTarget = new EventTarget();
  eventTarget.addEventListener('test', cb1);
  eventTarget.addEventListener('test', cb2);

  setTimeout(() => {
    const evt1 = new Event('test', { x: 1 });
    eventTarget.dispatchEvent(evt1);

    eventTarget.removeEventListener('test', cb1);

    const evt2 = new Event('test', { x: 2 });
    eventTarget.dispatchEvent(evt2);

    eventTarget.removeEventListener('test', cb2);

    const evt3 = new Event('test', { x: 3 });
    eventTarget.dispatchEvent(evt3);
    
    console.log('Done! --', evts.length, '=== 3');
  });
})();