import Enum from '@dbux/common/src/util/Enum';


// eslint-disable-next-line import/no-mutable-exports
let ParsePhase = {
  Init: 1,
  Enter: 2,
  Exit1: 3,
  Exit: 4,
  Instrument1: 5,
  Instrument: 6
};

ParsePhase = new Enum(ParsePhase);


export default ParsePhase;