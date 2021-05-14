import Enum from '@dbux/common/src/util/Enum';


// eslint-disable-next-line import/no-mutable-exports
let ParsePhase = {
  Init: 1,
  Enter: 2,
  Exit: 3,
  Instrument: 4,
  Instrument2: 5
};

ParsePhase = new Enum(ParsePhase);


export default ParsePhase;