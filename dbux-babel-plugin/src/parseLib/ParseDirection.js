import Enum from '@dbux/common/src/util/Enum';

const InstrumentationDirectionCfg = {
  Enter: 1,
  Exit: 2
};

/**
 * @type {typeof InstrumentationDirectionCfg | Enum}
 */
const InstrumentationDirection = new Enum(InstrumentationDirectionCfg);

export default InstrumentationDirection;