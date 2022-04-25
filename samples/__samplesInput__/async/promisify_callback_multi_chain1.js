import { P } from '../../util/asyncUtil';

function f(r) {
  setTimeout(() => r());
}

P(
  'A',
  () => {
    return new Promise(r => {
      f(r);
      f(r);
    })
  }
);