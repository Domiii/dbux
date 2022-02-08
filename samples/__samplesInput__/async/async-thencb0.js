const { P } = require('../../util/asyncUtil');


P()
  .then(
    async () => {
      return P()
        .then(() => 'AA');
    }
  )
  .then(
    () => 'AB'
  );

P()
  .then(
    () => {
      return P()
        .then(() => 'BA');
    }
  )
  .then(
    () => 'BB'
  );